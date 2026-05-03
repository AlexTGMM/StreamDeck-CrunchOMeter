import streamDeck, {
	action,
	SingletonAction,
	WillAppearEvent,
	KeyDownEvent,
	SendToPluginEvent,
	DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { Crunch } from "../crunch/crunch";
import { ClubStatus } from "../crunch/ClubStatus";
import { Key } from "readline";
import { stat } from "fs";
import { getSeconds } from "date-fns";

@action({ UUID: "com.alexnickels.crunchometer.crunchometer" })
export class CrunchButton extends SingletonAction<ClubSettings> {
	private intervals: Map<number, NodeJS.Timeout> = new Map();

	constructor() {
		super();
	}

	// Handles initial loading
	public override onWillAppear(ev: WillAppearEvent<ClubSettings>) {
		this.updateKey(ev);
	}

	// Refreshes data on key press
	public override onKeyDown(ev: KeyDownEvent<ClubSettings>) {
		this.updateKey(ev);
	}

	public override onDidReceiveSettings(
		ev: DidReceiveSettingsEvent<ClubSettings>,
	) {
		this.updateKey(ev);
	}

	// These events all share a parent, but it isn't exported publicly
	private async updateKey(
		ev:
			| DidReceiveSettingsEvent<ClubSettings>
			| KeyDownEvent<ClubSettings>
			| WillAppearEvent<ClubSettings>,
		existingStatus?: ClubStatus,
		isRecurse = false,
	): Promise<void> {
		const clubId = ev.payload.settings.clubId;
		streamDeck.logger.debug(
			`starting Updating key for club ${clubId}, isRecurse:${isRecurse}`,
		);
		// Newly placed key before it's configured
		if (!clubId) {
			ev.action.setTitle("No club\nselected");
			return;
		}

		// dont run the update if this is a recurse for a club that is no longer configured
		if (
			isRecurse &&
			!(await this.getAllSettings()).find((settings) => {
				streamDeck.logger.debug(
					`got setting for club ${settings.clubId}, comparing to ${clubId}`,
				);
				return settings.clubId == clubId;
			}) == undefined
		) {
			clearInterval(this.intervals.get(clubId));
			this.intervals.delete(clubId);
			streamDeck.logger.debug(
				`Clearing interval for club ${clubId} because it is no longer selected in any keys`,
			);
			return;
		}
		streamDeck.logger.debug(`actually updating key for club ${clubId}`);
		// if we passed in a title, use it, otherwise get a new one
		Promise.resolve(existingStatus ?? this.getKeyTitle(clubId)).then(
			(clubStatus) => {
				// update the title
				ev.action.setTitle(clubStatus.title());

				const occupancyLevel =
					clubStatus.club.current_occupancy /
					Math.max(1, clubStatus.club.max_occupancy);
				streamDeck.logger.debug(
					`Club ${clubId} as occupancy level ${occupancyLevel} ${clubStatus.club.current_occupancy}/${clubStatus.club.max_occupancy}`,
				);
				// update the image
				if (clubStatus.isClosed) {
					ev.action.setImage(
						// solid black square
						`data:image/svg+xml,` +
							encodeURIComponent(
								`<svg width="100" height="100"><rect width="100%" height="100%" fill="black" /></svg>`,
							),
					);
				} else if (occupancyLevel <= 0.5) {
					ev.action.setImage("imgs/barbells/Green");
				} else if (occupancyLevel <= 0.75) {
					ev.action.setImage("imgs/barbells/Yellow");
				} else {
					ev.action.setImage("imgs/barbells/Red");
				}

				// These intervals reschedule themselves every time they're called, but this gives us an
				// opportunity to cancel them, and if it crashes once, we don't lose the updater thread
				if (this.intervals.has(clubId)) {
					clearInterval(this.intervals.get(clubId));
				}
				const now = new Date();
				this.intervals.set(
					clubId,
					setInterval(
						() => {
							if (
								clubStatus.isClosed &&
								(clubStatus.closedUntil ?? now < now)
							) {
								this.updateKey(ev, clubStatus, true);
							} else {
								this.updateKey(ev, undefined, true);
							}
						},
						clubStatus.isClosed
							? // if we're displaying times, update 1 second after the next minute starts
								(61 - getSeconds(now)) * 1000
							: // if we're fetching new data, update every 10 minutes
								10 * 60 * 1000,
					),
				);
			},
		);
	}

	private async getAllSettings(): Promise<ClubSettings[]> {
		return await Promise.all(
			this.actions.map((action) => {
				return action.getSettings();
			}),
		);
	}

	// Common logic for loading club data and calculatinFg the title
	private async getKeyTitle(clubId: number): Promise<ClubStatus> {
		const club = await Crunch.getClub(clubId);
		streamDeck.logger.debug(club);
		return Crunch.getClubStatus(club);
	}

	// Handles data loading requests from the Property Inspector
	public override onSendToPlugin(
		ev: SendToPluginEvent<JsonValue, ClubSettings>,
	): Promise<void> | void {
		// Check if the payload is requesting a data source, i.e. the structure is { event: string }
		if (
			ev.payload instanceof Object &&
			"event" in ev.payload &&
			ev.payload.event === "getClubs"
		) {
			streamDeck.logger.debug("Received request for clubs data source");
			Crunch.getAllClubs().then((clubs) => {
				streamDeck.logger.debug(clubs);
				const result = clubs.map((club) => ({
					label: `${club.address.state}-${club.name}`,
					value: club.id,
					disabled: club.occupancy_status == "unknown",
				}));
				result.sort((a, b) => a.label.localeCompare(b.label));
				streamDeck.ui.sendToPropertyInspector({
					event: "getClubs",
					items: result,
				});
			});
		} else {
			streamDeck.logger.error(
				"Received unknown payload from Property Inspector",
				ev.payload,
			);
		}
	}
}

export type ClubSettings = {
	clubId?: number;
};
