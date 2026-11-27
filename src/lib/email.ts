import "server-only";
import { Resend } from "resend";
import { BUSINESS, SCHEDULING_URL, SITE_URL } from "@/lib/env";
import { firstName, formatDate, formatTime } from "@/lib/format";
import { serviceDetailRows } from "@/lib/services";

export type NewBooking = {
  id: string;
  full_name: string;
  email: string;
  event_type: string;
  service_package: string;
  event_date: string;
  guest_count: number | null;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  details: string | null;
  service_details: unknown;
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf6ea;font-family:Helvetica,Arial,sans-serif;color:#1c1a15">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border:1px solid #e9dfc5;border-top:4px solid #b8912f;border-radius:12px;padding:28px">
      <h1 style="font-family:Georgia,serif;font-weight:600;font-size:22px;margin:0 0 16px">${esc(title)}</h1>
      ${body}
    </div>
    <p style="text-align:center;color:#8a8069;font-size:12px;margin-top:18px">${esc(BUSINESS.name)} · ${esc(BUSINESS.location)}</p>
  </div></body></html>`;
}

function detailsTable(b: NewBooking): string {
  const meeting = [b.meeting_date ? formatDate(b.meeting_date) : "", formatTime(b.meeting_time)].filter(Boolean).join(" at ");
  const rows: [string, string][] = [
    ["Event", b.event_type],
    ["Package", b.service_package],
    ["Preferred date", formatDate(b.event_date)],
    ["Guests", b.guest_count ? String(b.guest_count) : "Not specified"],
    ["Meeting", meeting || "No preference"],
    ["Meeting place", b.meeting_location || "No preference"],
    ...serviceDetailRows(b.service_package, b.service_details),
  ];
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 16px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#6b6154;width:140px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

/**
 * Sends the owner alert and the client acknowledgement.
 * Never throws: the booking is already saved, so an email problem must not fail the request.
 */
export async function sendNewBookingEmails(b: NewBooking): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "BBE Events <onboarding@resend.dev>";
  const owner = process.env.OWNER_EMAIL || BUSINESS.email;
  const notes = b.details
    ? `<p style="margin:0 0 6px;color:#6b6154;font-size:13px">Additional details</p><div style="background:#faf6ea;border-radius:8px;padding:12px 14px;white-space:pre-wrap;font-size:14px">${esc(b.details)}</div>`
    : "";

  const ownerEmail = {
    from,
    to: owner,
    replyTo: b.email,
    subject: `New ${b.service_package} request: ${b.full_name} (${b.event_type}, ${formatDate(b.event_date)})`,
    html: layout(
      `New ${b.service_package} request`,
      `<p style="margin:0 0 4px;font-size:16px;font-weight:600">${esc(b.full_name)}</p>
       <p style="margin:0 0 12px"><a href="mailto:${esc(b.email)}" style="color:#9c7a24">${esc(b.email)}</a></p>
       ${detailsTable(b)}${notes}
       <p style="margin:22px 0 0"><a href="${esc(`${SITE_URL}/admin/bookings/${b.id}`)}" style="display:inline-block;background:#b8912f;color:#14120d;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:30px">Open in dashboard</a></p>
       <p style="color:#6b6154;font-size:13px;margin-top:14px">Reply to this email to contact the client directly.</p>`,
    ),
  };

  const clientEmail = {
    from,
    to: b.email,
    replyTo: owner,
    subject: `We received your booking request, ${BUSINESS.name}`,
    html: layout(
      `Thank you, ${firstName(b.full_name)}!`,
      `<p style="margin:0 0 12px;line-height:1.6">We've received your booking request. It's now <strong>pending review</strong>. Our team will email you to discuss your event and confirm the arrangements.</p>
       ${detailsTable(b)}
       ${
         SCHEDULING_URL
           ? `<p style="margin:0 0 12px;line-height:1.6">Want to lock in a consultation time? <a href="${esc(SCHEDULING_URL)}" style="color:#9c7a24;font-weight:600">Pick a meeting slot</a>.</p>`
           : ""
       }
       <p style="margin:0;line-height:1.6">Questions in the meantime? Just reply to this email.</p>
       <p style="margin:18px 0 0;color:#6b6154;font-size:13px">This is not yet a confirmed booking. Your date is confirmed once we've agreed on the details together.</p>`,
    ),
  };

  const results = await Promise.allSettled([resend.emails.send(ownerEmail), resend.emails.send(clientEmail)]);
  results.forEach((r, i) => {
    const which = i === 0 ? "owner alert" : "client acknowledgement";
    if (r.status === "rejected") console.error(`Resend ${which} failed:`, r.reason);
    else if (r.value.error) console.error(`Resend ${which} failed:`, r.value.error);
  });
}
