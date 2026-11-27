import Link from "next/link";
import { formatAgo, formatDate, formatStamp } from "@/lib/format";
import { SERVICE_PACKAGES, type Booking, type BookingStatus, type ServicePackage } from "@/lib/types";

const PILL: Record<BookingStatus, string> = {
  Pending: "border-gold/50 bg-gold/12 text-gold-strong",
  Contacted: "border-info/40 bg-info-soft text-info",
  Confirmed: "border-ok/40 bg-ok-soft text-ok",
  Completed: "border-line bg-neutral-soft text-fg/80",
  Rejected: "border-danger/40 bg-danger-soft text-danger",
  Cancelled: "border-danger/40 bg-danger-soft text-danger",
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase ${PILL[status]}`}>{status}</span>;
}

/** Shows which service a booking is for: solid gold = Full, outlined = Half. */
export function ServicePill({ service }: { service: ServicePackage }) {
  const full = service === "Full Service";
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase ${
        full ? "bg-gradient-to-br from-gold-strong to-gold text-ink" : "border border-gold/60 text-gold-strong"
      }`}
    >
      {full ? "Full" : "Half"}
    </span>
  );
}

/**
 * All / Full Service / Half Service filter tabs. Kept in the URL (?service=…)
 * alongside any other filters on the page.
 */
export function ServiceTabs({
  basePath,
  params,
  counts,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  counts?: Partial<Record<ServicePackage | "all", number>>;
}) {
  const current = params.service ?? "";
  const href = (service: string) => {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "service" && next.set(k, v));
    if (service) next.set("service", service);
    const q = next.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  const tabs: { value: string; label: string; count?: number }[] = [
    { value: "", label: "All services", count: counts?.all },
    ...SERVICE_PACKAGES.map((s) => ({ value: s, label: s, count: counts?.[s] })),
  ];

  return (
    <nav aria-label="Filter by service" className="mb-5 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.value === current;
        return (
          <Link
            key={t.label}
            href={href(t.value)}
            aria-current={active ? "page" : undefined}
            scroll={false}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold transition ${
              active ? "border-gold bg-gold/15 text-fg" : "border-line bg-surface text-muted hover:border-gold/50 hover:text-fg"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${active ? "bg-gold text-ink" : "bg-secondary text-muted"}`}>{t.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Small gold outline button used in admin panel headers. */
export const goldOutlineBtn =
  "btn btn-sm rounded-md border border-gold/50 text-[11px] tracking-[0.14em] text-gold uppercase hover:bg-gold/10";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`lux-panel overflow-hidden ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 px-5 py-4">
          <h2 className="font-serif text-[19px] text-gold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type Column = "client" | "event" | "package" | "date" | "status" | "submitted" | "updated";

const HEAD: Record<Column, { label: string; className?: string }> = {
  client: { label: "Client" },
  event: { label: "Event" },
  package: { label: "Service" },
  date: { label: "Event date" },
  status: { label: "Status" },
  submitted: { label: "Submitted", className: "hidden md:table-cell" },
  updated: { label: "Last updated", className: "hidden md:table-cell" },
};

/** Table of bookings; each row links to the booking's detail page. */
export function BookingTable({ bookings, columns, empty }: { bookings: Booking[]; columns: Column[]; empty: string }) {
  if (!bookings.length) return <p className="px-5 py-10 text-center text-muted">{empty}</p>;

  const cell = (b: Booking, c: Column) => {
    switch (c) {
      case "client":
        return (
          <>
            <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-fg after:absolute after:inset-0 hover:text-gold-strong focus-visible:underline">
              {b.full_name}
            </Link>
            <div className="text-[13px] text-muted">{b.email}</div>
          </>
        );
      case "event":
        return (
          <>
            {b.event_type}
            {b.guest_count ? <div className="text-[13px] text-muted">{b.guest_count} guests</div> : null}
          </>
        );
      case "package":
        return <ServicePill service={b.service_package} />;
      case "date":
        return <span className="whitespace-nowrap">{formatDate(b.event_date)}</span>;
      case "status":
        return <StatusPill status={b.status} />;
      case "submitted":
        return <span className="whitespace-nowrap text-muted">{formatAgo(b.created_at)}</span>;
      case "updated":
        return <span className="whitespace-nowrap text-muted">{formatStamp(b.updated_at)}</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className={`border-b border-gold/25 bg-gold/[0.04] px-4 py-3 text-[11px] font-semibold tracking-[0.16em] whitespace-nowrap text-gold uppercase md:px-5 ${HEAD[c].className ?? ""}`}
              >
                {HEAD[c].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="relative border-b border-gold/12 transition last:border-0 hover:bg-gold/[0.06]">
              {columns.map((c) => (
                <td key={c} className={`px-4 py-3.5 align-middle md:px-5 ${HEAD[c].className ?? ""}`}>
                  {cell(b, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Two-line list used on the dashboard. */
export function MiniList({ items, empty }: { items: { id: string; title: string; sub: string; right: string }[]; empty: string }) {
  if (!items.length) return <p className="px-5 py-8 text-center text-muted">{empty}</p>;
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id} className="relative flex items-center justify-between gap-3 border-b border-gold/12 px-5 py-3.5 last:border-0 hover:bg-gold/[0.06]">
          <div className="min-w-0">
            <Link href={`/admin/bookings/${i.id}`} className="font-semibold text-fg after:absolute after:inset-0 hover:text-gold-strong">
              {i.title}
            </Link>
            <div className="truncate text-[13px] text-muted">{i.sub}</div>
          </div>
          <span className="shrink-0 text-sm whitespace-nowrap text-gold/90">{i.right}</span>
        </li>
      ))}
    </ul>
  );
}
