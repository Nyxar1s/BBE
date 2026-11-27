import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, ServicePill, StatusPill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { BUSINESS } from "@/lib/env";
import { adminDisplayName, firstName, formatDate, formatStamp, formatTime } from "@/lib/format";
import { serviceDetailRows } from "@/lib/services";
import type { Booking, StatusChange } from "@/lib/types";
import { ContactActions, StatusControl } from "./BookingActions";

function emailDraft(b: Booking) {
  const subject = `Your ${BUSINESS.name} ${b.service_package} request: ${b.event_type} on ${formatDate(b.event_date)}`;
  const body =
    `Hi ${firstName(b.full_name)},\n\n` +
    `Thank you for your booking request for a ${b.event_type} (${b.service_package}) on ${formatDate(b.event_date)}.\n\n` +
    `\n\nBest regards,\n${BUSINESS.name}`;
  return { subject, body };
}

/** Opens a compose window in Gmail (web), already addressed and filled in. */
function gmailFor(b: Booking): string {
  const { subject, body } = emailDraft(b);
  const q = (v: string) => encodeURIComponent(v); // %20 for spaces; Gmail doesn't always decode "+"
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${q(b.email)}&su=${q(subject)}&body=${q(body)}`;
}

/** Opens the computer's default email app (e.g. Outlook). */
function mailtoFor(b: Booking): string {
  const { subject, body } = emailDraft(b);
  return `mailto:${b.email.replace(/[?&#%]/g, encodeURIComponent)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[170px_1fr] sm:gap-y-2.5">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase sm:pt-0.5">{k}</dt>
          <dd className="mb-2.5 font-medium break-words sm:mb-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: booking }, { data: history }] = await Promise.all([
    supabase.from("bookings").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("booking_status_history")
      .select("id, old_status, new_status, changed_at, admins(email)")
      .eq("booking_id", id)
      .order("changed_at", { ascending: true }),
  ]);
  if (!booking) notFound();

  const b = booking as Booking;
  const changes = (history ?? []) as unknown as StatusChange[];
  const serviceRows = serviceDetailRows(b.service_package, b.service_details);
  const meeting = [b.meeting_date ? formatDate(b.meeting_date) : "", formatTime(b.meeting_time)].filter(Boolean).join(" at ");

  return (
    <>
      <Link href="/admin/bookings" className="mb-4 inline-block text-[12px] tracking-[0.16em] text-gold uppercase hover:text-gold-strong">
        ← All bookings
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="gold-text text-[30px] leading-tight break-words">{b.full_name}</h2>
        <ServicePill service={b.service_package} />
        <StatusPill status={b.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="Contact">
            <div className="p-5">
              <Details rows={[["Email", b.email], ["Submitted", formatStamp(b.created_at)]]} />
              <ContactActions id={b.id} email={b.email} gmail={gmailFor(b)} mailto={mailtoFor(b)} status={b.status} />
            </div>
          </Panel>

          <Panel title={`${b.service_package} details`}>
            <div className="p-5">
              {serviceRows.length ? (
                <Details rows={serviceRows} />
              ) : (
                <p className="text-sm text-muted">
                  No service-specific answers saved. This booking was sent before the separate service forms, or its answers
                  are in &ldquo;Additional details&rdquo; below.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Event">
            <div className="p-5">
              <Details
                rows={[
                  ["Event type", b.event_type],
                  ["Service package", b.service_package],
                  ["Preferred date", formatDate(b.event_date)],
                  ["Guests", b.guest_count ?? "Not specified"],
                  ["Meeting date & time", meeting || "No preference"],
                  ["Meeting location", b.meeting_location || "No preference"],
                ]}
              />
              <h3 className="mt-6 mb-2 font-sans text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Additional details</h3>
              <div className="rounded-lg border border-gold/25 bg-secondary px-4 py-3.5 break-words whitespace-pre-wrap text-fg/80">
                {b.details || "None provided."}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status">
            <div className="p-5">
              <StatusControl id={b.id} status={b.status} />
            </div>
          </Panel>

          <Panel title="Status history">
            <ol className="m-5 ml-6 border-l-2 border-dotted border-gold/45">
              {changes.map((h) => (
                <li key={h.id} className="relative pb-4 pl-5 text-[13.5px] last:pb-0">
                  <span className="absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-surface bg-[#e2c15a] shadow-[0_0_10px_rgba(212,175,55,.6)]" />
                  {h.old_status ? `${h.old_status} → ` : "Submitted as "}
                  <strong>{h.new_status}</strong>
                  <div className="text-[12.5px] text-muted">
                    {formatStamp(h.changed_at)}
                    {h.admins ? ` · ${adminDisplayName(h.admins.email)}` : h.old_status ? "" : " · by client"}
                  </div>
                </li>
              ))}
              {!changes.length && <li className="pl-5 text-muted">No changes yet.</li>}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
