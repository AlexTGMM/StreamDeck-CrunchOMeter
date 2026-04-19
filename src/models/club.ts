interface ImageUrls {
    original: string;
    mx?: string;
    md?: string;
    sm?: string;
    xs?: string;
    lg?: string;
    xl?: string;
}

interface MapImageUrls {
    original: string;
    md?: string;
}

export type DayOfWeek = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

interface HoursInternal {
    sunday: DailyHours;
    monday: DailyHours;
    tuesday: DailyHours;
    wednesday: DailyHours;
    thursday: DailyHours;
    friday: DailyHours;
    saturday: DailyHours;
}

interface DailyHours {
    open_time: string;
    close_time: string;
}

interface Mms {
    name: string;
    club_id: string;
}

interface Address {
    id: number;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    zip: string;
    country_code: string;
}

interface MetaDatum {
    id: number;
    title: string;
    description: string;
}

interface Photo {
    id: number;
    image_url: ImageUrls;
    title: string;
    caption: string;
    alt: string;
    position: number;
}

interface Contact {
    id: number;
    name: string;
    title: string;
    email: string;
}

interface Amenity {
    id: number;
    name: string;
    description: string;
    image_url: ImageUrls;
    icon_class: string;
    vfp_category: string | null;
}

interface Faq {
    position: number;
    title: string;
    description: string;
}

interface Addon {
    id: number;
    addon_type: string;
    profit_center: string;
    price: number;
    price_pre_tax: number;
    schedule_due_date: string;
    recurring: boolean;
    default_checked: boolean;
    quantity: number;
}

interface MmsPrice {
    payment_type: string;
    mms_promo_code: string | null;
    mms_installment_id: string | null;
    mms_plan_id: string;
    mms_group_id: string | null;
    base_price: number;
    annual_fee: number;
    annual_price: number;
    prorated_annual_fee: number;
    enrollment_fee: number;
    dot_fit_fee: number | null;
    first_month_price: number;
    last_month_price: number;
    processing_fee: number;
    tax: number;
    total_price: number;
    updated: boolean;
    mms_info: Mms;
    recurring_processing_fee: number;
    addons: Addon[];
    first_due_date: string;
    first_annual_fee_date: string;
    untaxed_annual_fee: number;
    recurring_annual_fee_date: string;
    term_in_months: number;
    expiration_date: string | null;
    description: string | null;
    web_expiration_date: string | null;
}

interface Promo {
    name: string;
    customer_promo_code: string;
    description: string | null;
    end_date: string | null;
    show_expiration_date: boolean;
    auto_apply: boolean;
    mms_prices: MmsPrice[];
    included_addons: any[];
    display_name: string;
    typed_in_code: string | null;
}

interface Plan {
    category: string;
    description: string | null;
    promos: Promo[];
    mms_prices: MmsPrice[];
    reciprocity_groups: any[];
    amenities_from_plan: Amenity[];
    amenities_from_addon: Amenity[];
    amenities_from_member_perks: Amenity[];
    amenities_from_relax_recover_services: any[];
}

export interface Club {
    id: number;
    name: string;
    abbreviation: string | null;
    club_type: string;
    phone: string;
    email: string;
    gm_emails: string[];
    mms_api: string;
    mms_instance: string;
    mms_id: string;
    hours: string;
    special_hours: string | null;
    additional_hours: string | null;
    virtual_tour_url: string | null;
    facebook_url: string;
    facebook_handle: string;
    instagram_url: string;
    instagram_handle: string;
    twitter_url: string;
    twitter_handle: string;
    latitude: number;
    longitude: number;
    enrollment_center_text: string | null;
    enrollment_center_address: string | null;
    hero_image_url: ImageUrls;
    map_image_url: MapImageUrls;
    membership_pdf_url: string;
    personal_trainer_pdf_url: string;
    slug: string;
    schedule_image_1_url: string | null;
    schedule_image_2_url: string | null;
    industry_leading_strength_cardio_copy_icon: string;
    world_class_personal_trainers_copy_icon: string;
    famous_group_fitness_classes_copy_icon: string;
    membership_benefits_copy_icon: string;
    ideawork_id: string | null;
    status: string;
    status_code: number;
    mms: Mms;
    homepage_cta_id: string;
    kiosk_enabled: boolean;
    ach_only: boolean;
    ach_default: boolean;
    primary_cta_id: string;
    secondary_cta_id: string;
    time_zone: string;
    front_desk_email: string;
    executive_email: string | null;
    reporting_id: string;
    online_reservations: boolean;
    no_show_late_cancel_fees: boolean;
    fee_configuration: string;
    no_show_fee_amount: number;
    late_cancel_fee_amount: number;
    published_time: string;
    preferred_locale: string;
    currency: string;
    current_occupancy: number;
    max_occupancy: number;
    occupancy_status: string;
    crunch_o_meter: boolean;
    apple_watch_connected: boolean;
    disable_pt_sales: boolean;
    enable_enhance: boolean;
    with_rotating_qr_code: boolean;
    only_with_primary_device: boolean;
    hours_internal: HoursInternal;
    why_choose_crunch_copy: string;
    vfp_ach_only: boolean;
    industry_leading_strength_cardio_copy: string;
    world_class_personal_trainers_copy: string;
    famous_group_fitness_classes_copy: string;
    membership_benefits_copy: string;
    join_today_copy: string;
    still_not_sure_copy: string;
    last_member_sync_at: string;
    minimum_contract_length: number;
    notice_period_length: number;
    term_buyout_price: number | null;
    click_to_cancel: boolean;
    reduce_rate_saving_offer: boolean;
    free_addon_saving_offer: boolean;
    paid_coko: boolean;
    kids_crunch_mm: boolean;
    c1ko_mm: boolean;
    address: Address;
    meta_datum: MetaDatum;
    photos: Photo[];
    contacts: Contact[];
    amenities: Amenity[];
    faqs: Faq[];
    plans: Plan[];
}