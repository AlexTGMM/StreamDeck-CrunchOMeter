import fetch from "node-fetch";
import { AllClubs } from "../models/allClubs";
import { Club, DayOfWeek } from "../models/club";
import { intervalToDuration, parse } from "date-fns";
import streamDeck from "@elgato/streamdeck";
import { el } from "date-fns/locale";

export class Crunch {
	public static async getClub(clubId: number) {
		const clubData = await fetch(
			`https://www.crunch.com/crunch_core/clubs/${clubId}`,
		);
		return (await clubData.json()) as Club;
	}

	public static async getAllClubs() {
		const clubsData = await fetch("https://www.crunch.com/crunch_core/clubs");
		return (await clubsData.json()) as AllClubs;
	}

	private static parseDate(time: string, now: Date, dayOffset: number): Date {
		// TODO: The timezones in the data are non-standard.  For now, this assumes the plugin is
		// running in the same timezone as the club

		// since the day is missing in the input, we have to manually increment the offset for midnight
		if (time == "24:00") dayOffset += 1;

		return parse(time, "kk:mm", new Date().setDate(now.getDate() + dayOffset));
	}

	public static getClubStatus(club: Club): ClubStatus {
		const now = new Date();
		const dayOfWeek = this.dayToString(now.getDay());
		const hoursForToday = club.hours_internal[dayOfWeek];
		const openTime = this.parseDate(hoursForToday.open_time, now, 0);
		// If the next open time is today
		if (now < this.parseDate(hoursForToday.open_time, now, 0)) {
			streamDeck.logger.info(`Current time: ${now}, Open time: ${openTime}`);
			return new ClubStatus(club, true, openTime);
		} else if (now > this.parseDate(hoursForToday.close_time, now, 0)) {
			// if it's after today's close time, check the next open time tomorrow
			// TODO: This assumes that the clubs are open every day
			const nextDayOfWeek = this.dayToString((now.getDay() + 1) % 7);
			const nextOpenTime = this.parseDate(
				club.hours_internal[nextDayOfWeek].open_time,
				now,
				1,
			);
			streamDeck.logger.info(
				`Current time: ${now}, Open time: ${nextOpenTime}`,
			);
			return new ClubStatus(club, true, nextOpenTime);
		}
		return new ClubStatus(club, false);
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

export class ClubStatus {
	club: Club;
	isClosed: boolean;
	closedUntil?: Date;
	constructor(club: Club, isClosed: boolean, selfUpdatesUntil?: Date) {
		this.club = club;
		this.isClosed = isClosed;
		this.closedUntil = selfUpdatesUntil;
	}

	public title(): string {
		var title: string;
		if (this.isClosed) {
			// This should always be defined if the club is closed
			if (this.closedUntil) {
				title = ClubStatus.opensIn(new Date(), this.closedUntil);
			} else {
				streamDeck.logger.error(
					"Club is closed but selfUpdatesUntil is not defined",
				);
				title = "Closed";
			}
		} else {
			title = this.club.occupancy_status;
		}
		return title + `\n${this.club.name}`;
	}

	private static opensIn(now: Date, openTime: Date): string {
		const { hours, minutes } = intervalToDuration({
			start: now,
			end: openTime,
		});
		return `Opens in\n${hours?.toString().padStart(2, "0").concat(":") ?? ""}${minutes?.toString().padStart(2, "0") ?? "00"}`;
	}
}
