import streamDeck, { action, SingletonAction, WillAppearEvent, KeyDownEvent, SendToPluginEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { intervalToDuration, parse } from "date-fns";
import { Club, DayOfWeek } from "../models/club";
import { Crunch } from "../crunch/crunch";
import { get } from "http";


@action({ UUID: "com.alexnickels.crunchometer.crunchometer" })
export class DisplayButton extends SingletonAction<ClubSettings> {

	constructor() {
		super();
		streamDeck.settings.onDidReceiveGlobalSettings(ev => {
			streamDeck.logger.info("Received global settings", ev.settings);
			this.getKeyTitle(ev.settings.clubId as number | undefined).then(title =>
				this.actions.forEach(action => action.manifestId === this.manifestId && action.setTitle(title))
			);
		});
	}

	// Handles initial loading
	override onWillAppear(ev: WillAppearEvent<ClubSettings>) {
		this.getKeyTitle(ev.payload.settings.clubId).then(title => ev.action.setTitle(title));
	}

	// Refreshes data on key press
	override onKeyDown(ev: KeyDownEvent<ClubSettings>) {
		this.getKeyTitle(ev.payload.settings.clubId).then(title => ev.action.setTitle(title));
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ClubSettings>) {
		streamDeck.logger.info("Settings updated", ev.payload.settings);
		this.getKeyTitle(ev.payload.settings.clubId).then(title => ev.action.setTitle(title));
	}

	// Common logic for loading club data and calculatinFg the title
	private async getKeyTitle(clubId: number | undefined): Promise<string> {
		if (!clubId) {
			streamDeck.logger.info("No club selected");
			return `No club selected`;
		}
		const club = await Crunch.getClub(clubId);
		streamDeck.logger.info(club);
		return Crunch.checkClosed(club) ?? club.occupancy_status;
	}

	// Handles data loading requests from the Property Inspector
	override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ClubSettings>): Promise<void> | void {
		// Check if the payload is requesting a data source, i.e. the structure is { event: string }
		if (ev.payload instanceof Object && "event" in ev.payload && ev.payload.event === "getClubs") {
			streamDeck.logger.info("Received request for clubs data source");
			Crunch.getAllClubs().then(clubs => {
				streamDeck.logger.info(clubs);
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