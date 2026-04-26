import fetch from "node-fetch";
import { AllClubs } from "../models/allClubs";
import { Club, DayOfWeek } from "../models/club";
import { intervalToDuration, parse } from "date-fns";
import streamDeck from "@elgato/streamdeck";

export class Crunch {
	static async getClub(clubId: number) {
		const clubData = await fetch(`https://www.crunch.com/crunch_core/clubs/${clubId}`);
		return await clubData.json() as Club;
	}

	static async getAllClubs() {
		const clubsData = await fetch('https://www.crunch.com/crunch_core/clubs');
		return await clubsData.json() as AllClubs;
	}

	private static opensIn(now: Date, openTime: Date): string {
		const { hours, minutes } = intervalToDuration({ start: now, end: openTime });
		return `Opens in\n${hours?.toString().padStart(2, "0").concat(":") ?? ""}${minutes?.toString().padStart(2, "0") ?? "00"}`;
	}

	private static parseDate(club: Club, day: DayOfWeek, time: string): Date {
		// TODO: The timezones in the data are non-standard.  For now, this assumes the plugin is 
		// running in the same timezone as the club	
		return parse(time, "kk:mm", new Date());
	}

	static checkClosed(club: Club): string | null {
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
			return this.opensIn(now, nextOpenTime);
		}
		return null;
	}

	private static dayToString(day: number): DayOfWeek {
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