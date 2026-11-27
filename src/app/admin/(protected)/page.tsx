import { CircleCheckBig, Inbox, Layers, MailCheck } from "lucide-react";
import Link from "next/link";
import { MiniList, Panel, ServiceTabs, goldOutlineBtn } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatAgo, formatDate, todayYmd } from "@/lib/format";
import { serviceCounts } from "@/lib/serviceCounts";
import { isServicePackage, type Booking, type BookingStatus } from "@/lib/types";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { supabase } = await requireAdmin();
  const raw = (await searchParams).service;
  const service = isServicePackage(raw) ? raw : undefined;
  const svc = service ? `&service=${encodeURIComponent(service)}` : "";

  const count = async (status?: BookingStatus) => {
    let q = supabase.from("bookings").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    if (service) q = q.eq("service_package", service);
    const { count } = await q;
    return count ?? 0;
  };

  let recentQ = supabase.from("bookings").select("*").eq("status", "Pending").order("created_at", { ascending: false }).limit(5);
  let upcomingQ = supabase
    .from("bookings")
    .select("*")
    .eq("status", "Confirmed")
    .gte("event_date", todayYmd())
    .order("event_date", { ascending: true })
    .limit(5);
  if (service) {
    recentQ = recentQ.eq("service_package", service);
    upcomingQ = upcomingQ.eq("service_package", service);
  }

  const [pending, contacted, confirmed, total, recentRes, upcomingRes, counts] = await Promise.all([
    count("Pending"),
    count("Contacted"),
    count("Confirmed"),
    count(),
    recentQ,
    upcomingQ,
    serviceCounts(supabase),
  ]);

  const recent = (recentRes.data ?? []) as Booking[];
  const upcoming = (upcomingRes.data ?? []) as Booking[];

  const stats = [
    { label: "New / Pending", value: pending, href: `/admin/bookings?view=new${svc}`, icon: Inbox },
    { label: "Contacted", value: contacted, href: `/admin/bookings?status=Contacted${svc}`, icon: MailCheck },
    { label: "Confirmed", value: confirmed, href: `/admin/bookings?status=Confirmed${svc}`, icon: CircleCheckBig },
    { label: "Total Bookings", value: total, href: `/admin/bookings${svc.replace("&", "?")}`, icon: Layers },
  ];

  return (
    <>
      <ServiceTabs basePath="/admin" params={{ service }} counts={counts} />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="lux-card relative overflow-hidden px-4 py-5 sm:px-6">
              <span className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.22),transparent_70%)]" />
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-surface text-gold shadow-[0_0_18px_rgba(212,175,55,.18)]">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </span>
              <div className="gold-text mt-4 font-serif text-[34px] leading-none font-semibold sm:text-[40px]">{s.value}</div>
              <div className="mt-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{s.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Newest requests" action={<Link href="/admin/bookings?view=new" className={goldOutlineBtn}>View all</Link>}>
          <MiniList
            empty="No new requests. You're all caught up."
            items={recent.map((b) => ({
              id: b.id,
              title: b.full_name,
              sub: `${b.service_package} · ${b.event_type}`,
              right: formatAgo(b.created_at),
            }))}
          />
        </Panel>
        <Panel
          title="Upcoming confirmed events"
          action={<Link href="/admin/bookings?status=Confirmed" className={goldOutlineBtn}>View all</Link>}
        >
          <MiniList
            empty="No upcoming confirmed events."
            items={upcoming.map((b) => ({ id: b.id, title: b.full_name, sub: `${b.service_package} · ${b.event_type}`, right: formatDate(b.event_date) }))}
          />
        </Panel>
      </div>
    </>
  );
}
