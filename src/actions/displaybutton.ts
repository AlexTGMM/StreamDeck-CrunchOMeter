import streamDeck, { action, KeyAction, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import fetch from "node-fetch";
import { DayOfWeek, Club } from "../models/club";
import { JsonValue, set } from "@elgato/utils";
import { AllClubs } from "../models/allClubs";
import { formatDistance, formatDuration, intervalToDuration } from "date-fns";
import { parse } from "date-fns";

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
		return this.checkClosed(club) ?? club.occupancy_status
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

	private checkClosed(club: Club): string | null {
		const now = new Date();
		const dayOfWeek = this.dayToString(now.getDay());
		const hoursForToday = club.hours_internal[dayOfWeek];
		const openTime = this.parseDate(club, dayOfWeek, hoursForToday.open_time);
		streamDeck.logger.info(`Current time: ${now}, Open time: ${openTime}`);
		// If the next open time is today
		if (now < this.parseDate(club, dayOfWeek, hoursForToday.open_time)) {
			return this.opensIn(now, openTime);
		} else if (now > this.parseDate(club, dayOfWeek, hoursForToday.close_time)) {
			// if it's after today's close time, check the next open time tomorrow
			// TODO: This assumes that the clubs are open every day
			const nextDayOfWeek = this.dayToString((now.getDay() + 1) % 6);
			const nextOpenTime = this.parseDate(club, nextDayOfWeek, club.hours_internal[nextDayOfWeek].open_time);
			return this.opensIn(now, nextOpenTime)
		}
		return null;
	}

	private opensIn(now: Date, openTime: Date): string {
		const { hours, minutes } = intervalToDuration({ start: now, end: openTime });
		return `Opens in\n${hours?.toString().padStart(2, "0").concat(":") ?? ""}${minutes?.toString().padStart(2, "0") ?? "00"}`;
	}

	private parseDate(club: Club, day: DayOfWeek, time: string): Date {
		// TODO: The timezones in the data are non-standard.  For now, this assumes the plugin is 
		// running in the same timezone as the club	
		return parse(time, "kk:mm", new Date());
	}

	private dayToString(day: number): DayOfWeek {
		switch (day) {
			case 0:
				return "sunday";
			case 1:
				return "monday";
			case 2:
				return "tuesday";
			case 3:
				return "wednesday";
			case 4:
				return "thursday";
			case 5:
				return "friday";
			case 6:
				return "saturday";
		}
		throw new Error("Invalid day number: " + day);
	}
}

type ClubSettings = {
	clubId?: number;
};
