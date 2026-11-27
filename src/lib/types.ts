export const STATUSES = ["Pending", "Contacted", "Confirmed", "Completed", "Rejected", "Cancelled"] as const;
export type BookingStatus = (typeof STATUSES)[number];

export const ACTIVE_STATUSES: BookingStatus[] = ["Pending", "Contacted", "Confirmed"];
export const PAST_STATUSES: BookingStatus[] = ["Completed", "Rejected", "Cancelled"];

export const SERVICE_PACKAGES = ["Full Service", "Half Service"] as const;
export type ServicePackage = (typeof SERVICE_PACKAGES)[number];

export const EVENT_TYPES = ["Wedding", "Birthday", "Debut", "Corporate Event", "Other"] as const;

export const MEETING_LOCATIONS = ["Office", "Client's Location", "Cafe", "Google Meet", "Zoom"] as const;

export type Booking = {
  id: string;
  full_name: string;
  email: string;
  event_type: string;
  service_package: ServicePackage;
  event_date: string; // YYYY-MM-DD
  guest_count: number | null;
  meeting_date: string | null;
  meeting_time: string | null; // HH:MM:SS
  meeting_location: string | null;
  details: string | null;
  service_details: Record<string, unknown> | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type StatusChange = {
  id: number;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_at: string;
  admins: { email: string } | null;
};

export type GalleryPhoto = {
  id: string;
  storage_path: string;
  image_url: string;
  caption: string;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  uploaded_at: string;
};

export function isStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function isServicePackage(value: unknown): value is ServicePackage {
  return typeof value === "string" && (SERVICE_PACKAGES as readonly string[]).includes(value);
}
