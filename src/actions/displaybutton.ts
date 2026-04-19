import streamDeck, { action, KeyAction, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import fetch from "node-fetch";
import { Club } from "../models/club";
import { JsonValue, set } from "@elgato/utils";
import { AllClubs } from "../models/allClubs";

@action({ UUID: "com.alexnickels.crunchometer.crunchometer" })
export class DisplayButton extends SingletonAction<ClubSettings> {

	// Handles initial loading
	override onWillAppear(ev: WillAppearEvent<ClubSettings>): void | Promise<void> {
		this.getKeyTitle(ev.payload.settings).then(title => ev.action.setTitle(title));
	}

	// Refreshes data on key press
	override async onKeyDown(ev: KeyDownEvent<ClubSettings>): Promise<void> {
		this.getKeyTitle(ev.payload.settings).then(title => ev.action.setTitle(title));
	}

	// Common logic for loading club data and calculating the title
	private async getKeyTitle(settings: ClubSettings): Promise<string> {
		const clubId = settings.clubId;
		if (!clubId) {
			streamDeck.logger.info("No club selected");
			return `No club selected`;
		}
		const club = await this.getClub(clubId);
		streamDeck.logger.info(club);
		return `${club.occupancy_status}`;
	}

	// Handles data loading requests from the Property Inspector
	override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ClubSettings>): Promise<void> | void {
		// Check if the payload is requesting a data source, i.e. the structure is { event: string }
		if (ev.payload instanceof Object && "event" in ev.payload && ev.payload.event === "getClubs") {
			streamDeck.logger.info("Received request for clubs data source");
			this.getAllClubs().then(clubs => {
				streamDeck.logger.info(clubs);
				const result = clubs.map(club => ({
					label: `${club.address.state}-${club.name}`,
					value: club.id,
					disabled: club.occupancy_status == "unknown"
				}))
				result.sort((a, b) => a.label.localeCompare(b.label))
				streamDeck.ui.sendToPropertyInspector({ event: "getClubs", items: result });
			})
		} else {
			streamDeck.logger.error("Received unknown payload from Property Inspector", ev.payload);
		}
	}

	private async getClub(clubId: number) {
		const clubData = await fetch(`https://www.crunch.com/crunch_core/clubs/${clubId}`)
		return await clubData.json() as Club;
	}

	private async getAllClubs() {
		const clubsData = await fetch('https://www.crunch.com/crunch_core/clubs')
		return await clubsData.json() as AllClubs;
	}
}

type ClubSettings = {
	clubId?: number;
};
