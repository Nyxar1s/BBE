import type { ServicePackage } from "@/lib/types";

/* Questions that only appear on one service's booking form. */

export const BUDGET_RANGES = [
  "Below ₱300,000",
  "₱300,000 – ₱500,000",
  "₱500,000 – ₱1,000,000",
  "Above ₱1,000,000",
  "Not sure yet",
] as const;

export const VENUE_STATUSES = ["Already booked", "Still looking", "Need recommendations"] as const;

export const SUPPLIER_TYPES = [
  "Venue",
  "Catering",
  "Photo & Video",
  "Hair & Makeup",
  "Flowers & Styling",
  "Lights & Sounds",
  "Attire",
  "Cake",
] as const;

export type FullServiceDetails = { budget: string; venue_status: string; theme: string | null };
export type HalfServiceDetails = { booked_suppliers: string[]; remaining_help: string | null };
export type ServiceDetails = FullServiceDetails | HalfServiceDetails;

/** Human-readable rows for emails and the admin booking page. */
export function serviceDetailRows(service: ServicePackage | string, details: unknown): [string, string][] {
  if (!details || typeof details !== "object") return [];
  const d = details as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : "Not specified");

  if (service === "Full Service") {
    return [
      ["Estimated budget", text(d.budget)],
      ["Venue", text(d.venue_status)],
      ["Theme / motif", text(d.theme)],
    ];
  }
  if (service === "Half Service") {
    const booked = Array.isArray(d.booked_suppliers) ? (d.booked_suppliers as string[]) : [];
    return [
      ["Suppliers already booked", booked.length ? booked.join(", ") : "None listed"],
      ["Still needs help with", text(d.remaining_help)],
    ];
  }
  return [];
}

export const SERVICE_FORM_COPY: Record<ServicePackage, { title: string; intro: string }> = {
  "Full Service": {
    title: "Full Service Booking",
    intro: "Complete planning and coordination. Tell us where you're starting from and we'll build the plan with you.",
  },
  "Half Service": {
    title: "Half Service Booking",
    intro: "For clients who've already booked at least half of their suppliers. Tell us what's done and what's left.",
  },
};

/** Short names used in the booking page address: /book?service=full or /book?service=half */
export const SERVICE_SLUGS: Record<ServicePackage, string> = { "Full Service": "full", "Half Service": "half" };

export function serviceFromSlug(slug: string | undefined): ServicePackage | undefined {
  return (Object.keys(SERVICE_SLUGS) as ServicePackage[]).find((s) => SERVICE_SLUGS[s] === slug);
}

export function bookingHref(service?: ServicePackage): string {
  return service ? `/book?service=${SERVICE_SLUGS[service]}` : "/book";
}
