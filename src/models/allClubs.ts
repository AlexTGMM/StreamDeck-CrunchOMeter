interface MapImageUrls {
	original: string;
	md?: string;
	sm?: string;
	xs?: string;
}

interface AddressSummary {
	address_1: string;
	address_2: string;
	city: string;
	state: string;
	zip: string;
	country_code: string;
}

interface ContactSummary {
	id: number;
	name: string;
	title: string;
	email: string;
	position: number;
}

interface OwnershipGroup {
	id: number;
	name: string;
}

interface ClubSummary {
	id: number;
	name: string;
	club_type: string;
	slug: string;
	map_image_url: MapImageUrls;
	distance_away: number | null;
	distance_away_string: string | null;
	address: AddressSummary;
	phone: string;
	email: string;
	contacts: ContactSummary[];
	status: string;
	status_code: number;
	latitude: number;
	longitude: number;
	published_time: string;
	time_zone: string;
	front_desk_email: string;
	executive_email: string | null;
	reporting_id: string;
	online_reservations: boolean;
	ideawork_id: string | null;
	mms_id: string;
	mms_api: string;
	mms_instance: string;
	late_cancel_fee_amount: number;
	preferred_locale: string;
	facebook_url: string;
	facebook_handle: string;
	instagram_url: string;
	instagram_handle: string;
	twitter_url: string | null;
	twitter_handle: string | null;
	no_show_late_cancel_fees: boolean;
	fee_configuration: string;
	crunch_o_meter: boolean;
	apple_watch_connected: boolean;
	occupancy_status: string;
	ownership_group: OwnershipGroup;
	opened_at: string | null;
}

export type AllClubs = ClubSummary[];
