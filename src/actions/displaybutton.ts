import streamDeck, { action, SingletonAction, WillAppearEvent, KeyDownEvent, SendToPluginEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { intervalToDuration, parse, set } from "date-fns";
import { Club, DayOfWeek } from "../models/club";
import { Crunch } from "../crunch/crunch";
import { get } from "http";
import { is, se } from "date-fns/locale";


@action({ UUID: "com.alexnickels.crunchometer.crunchometer" })
export class CrunchButton extends SingletonAction<ClubSettings> {

	private intervals: Map<number, NodeJS.Timeout> = new Map();

	constructor() {
		super();
	}

	// Handles initial loading
	override onWillAppear(ev: WillAppearEvent<ClubSettings>) {
		this.updateKey(ev);
	}

	// Refreshes data on key press
	override onKeyDown(ev: KeyDownEvent<ClubSettings>) {
		this.updateKey(ev);
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ClubSettings>) {
		this.updateKey(ev);
	}

	// These events all share a parent, but it isn't exported publicly
	private async updateKey(ev: KeyDownEvent<ClubSettings> | WillAppearEvent<ClubSettings> | DidReceiveSettingsEvent<ClubSettings>, isRecurse = false): Promise<void> {
		let clubId = ev.payload.settings.clubId;
		streamDeck.logger.debug(`starting Updating key for club ${clubId}, isRecurse:${isRecurse}`);
		if (!clubId) {
			ev.action.setTitle("No club\nselected");
			return;
		}

		// dont run the update if this is a recurse for a club that is no longer configured
		if (isRecurse &&
			!((await this.getAllSettings()).find(settings => {
				streamDeck.logger.debug(`got setting for club ${settings.clubId}, comparing to ${clubId}`);
				return settings.clubId == clubId
			})
			)) {
			clearInterval(this.intervals.get(clubId));
			this.intervals.delete(clubId);
			streamDeck.logger.debug(`Clearing interval for club ${clubId} because it is no longer selected in any keys`);
			return
		}
		streamDeck.logger.debug(`actually updating key for club ${clubId}`);
		this.getKeyTitle(clubId).then(title => ev.action.setTitle(title));

		// These intervals reschedule themselves every time they're called, but this gives us an opportunity to cancel them, and if it crashes once, we don't loose the updater thread
		if (this.intervals.has(clubId)) {
			clearInterval(this.intervals.get(clubId));
		}
		this.intervals.set(clubId, setInterval(() => {
			this.updateKey(ev, true);
		}, 10000));

	}

	private async getAllSettings(): Promise<ClubSettings[]> {
		return await Promise.all(this.actions.map(action => {
			return action.getSettings();
		}));
	}

	// Common logic for loading club data and calculatinFg the title
	private async getKeyTitle(clubId: number): Promise<string> {
		const club = await Crunch.getClub(clubId);
		streamDeck.logger.debug(club);
		return (Crunch.checkClosed(club) ?? club.occupancy_status) + `\n${club.name}`;
	}

	// Handles data loading requests from the Property Inspector
	override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ClubSettings>): Promise<void> | void {
		// Check if the payload is requesting a data source, i.e. the structure is { event: string }
		if (ev.payload instanceof Object && "event" in ev.payload && ev.payload.event === "getClubs") {
			streamDeck.logger.debug("Received request for clubs data source");
			Crunch.getAllClubs().then(clubs => {
				streamDeck.logger.debug(clubs);
				const result = clubs.map(club => ({
					label: `${club.address.state}-${club.name}`,
					value: club.id,
					disabled: club.occupancy_status == "unknown"
				}));
				result.sort((a, b) => a.label.localeCompare(b.label));
				streamDeck.ui.sendToPropertyInspector({ event: "getClubs", items: result });
			});
		} else {
			streamDeck.logger.error("Received unknown payload from Property Inspector", ev.payload);
		}
	}
}

export type ClubSettings = {
	clubId?: number;
};