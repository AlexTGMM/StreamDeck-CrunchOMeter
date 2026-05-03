import streamDeck from "@elgato/streamdeck";
import { intervalToDuration } from "date-fns";
import { Club } from "../models/club";


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
					"Club is closed but selfUpdatesUntil is not defined"
				);
				title = "Closed";
			}
		} else {
			// title case the occupancy status
			title = this.club.occupancy_status.split(' ').map(word => {
				return word.charAt(0).toUpperCase() + word.slice(1)
			}).join();
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
