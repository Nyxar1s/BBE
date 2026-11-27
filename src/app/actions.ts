"use server";

import { after } from "next/server";
import { z } from "zod";
import { sendNewBookingEmails, type NewBooking } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/env";
import { BUDGET_RANGES, SUPPLIER_TYPES, VENUE_STATUSES, serviceDetailRows, type ServiceDetails } from "@/lib/services";
import { createPublicClient } from "@/lib/supabase/server";
import { EVENT_TYPES, MEETING_LOCATIONS, SERVICE_PACKAGES } from "@/lib/types";

export type BookingFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; name: string; email: string; service: string };

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid date.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

/** Fields shared by both service forms. */
const CommonSchema = z.object({
  service_package: z.enum(SERVICE_PACKAGES),
  full_name: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  event_type: z.enum(EVENT_TYPES, { errorMap: () => ({ message: "Please choose an event type." }) }),
  event_date: ymd,
  guest_count: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 100000), "Enter a number of guests from 1 upward."),
  meeting_date: z.union([z.literal(""), ymd]).transform((v) => v || null),
  meeting_time: z
    .union([z.literal(""), z.string().regex(/^\d{2}:\d{2}$/, "Please choose a valid time.")])
    .transform((v) => v || null),
  meeting_location: z.union([z.literal(""), z.enum(MEETING_LOCATIONS)]).transform((v) => v || null),
  details: optionalText(5000),
});

const FullServiceSchema = z.object({
  budget: z.enum(BUDGET_RANGES, { errorMap: () => ({ message: "Please choose a budget range." }) }),
  venue_status: z.enum(VENUE_STATUSES, { errorMap: () => ({ message: "Please tell us about your venue." }) }),
  theme: optionalText(200),
});

const HalfServiceSchema = z.object({
  booked_suppliers: z
    .array(z.enum(SUPPLIER_TYPES))
    .min(1, "Please tick the suppliers you've already booked.")
    .max(SUPPLIER_TYPES.length),
  remaining_help: optionalText(1000),
});

/** Yesterday in Manila, giving clients in other timezones a day of slack. */
function earliestAllowedDate(): string {
  return new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function collectErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

const CHECK_FIELDS = "Please check the highlighted fields.";

export async function submitBooking(formData: FormData): Promise<BookingFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (String(formData.get("company") ?? "").length > 0) {
    return { status: "success", name: "there", email: "", service: "" };
  }
  if (!isSupabaseConfigured) {
    return { status: "error", message: "Online booking isn't connected yet. Please email us instead." };
  }

  const str = (k: string) => String(formData.get(k) ?? "");
  const common = CommonSchema.safeParse(Object.fromEntries(Object.keys(CommonSchema.shape).map((k) => [k, str(k)])));

  const service = str("service_package");
  const specific =
    service === "Full Service"
      ? FullServiceSchema.safeParse({ budget: str("budget"), venue_status: str("venue_status"), theme: str("theme") })
      : HalfServiceSchema.safeParse({
          booked_suppliers: formData.getAll("booked_suppliers").map(String),
          remaining_help: str("remaining_help"),
        });

  const fieldErrors = {
    ...(common.success ? {} : collectErrors(common.error.issues)),
    ...(specific.success ? {} : collectErrors(specific.error.issues)),
  };
  if (!common.success || !specific.success) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors };
  }

  const data = common.data;
  const minDate = earliestAllowedDate();
  if (data.event_date < minDate) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: { event_date: "The event date can't be in the past." } };
  }
  if (data.meeting_date && data.meeting_date < minDate) {
    return { status: "error", message: CHECK_FIELDS, fieldErrors: { meeting_date: "The meeting date can't be in the past." } };
  }

  // The id is generated here so the owner's email can link straight to the booking.
  const booking: NewBooking = {
    id: crypto.randomUUID(),
    ...data,
    service_details: specific.data as ServiceDetails,
  };

  const db = createPublicClient();
  let { error } = await db.from("bookings").insert(booking);

  // If migration 002 hasn't been run yet, the service_details column won't exist.
  // Save the answers inside "details" instead so no booking is lost.
  if (error && /service_details/.test(error.message)) {
    console.warn("bookings.service_details column missing: run supabase/migrations/002_service_details.sql");
    const { service_details, ...rest } = booking;
    const extra = serviceDetailRows(rest.service_package, service_details)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    ({ error } = await db.from("bookings").insert({ ...rest, details: [extra, rest.details].filter(Boolean).join("\n\n") }));
  }

  if (error) {
    console.error("Booking insert failed:", error);
    return { status: "error", message: "Sorry, we couldn't send your request. Please try again in a moment." };
  }

  after(() => sendNewBookingEmails(booking));

  return { status: "success", name: data.full_name, email: data.email, service: data.service_package };
}
