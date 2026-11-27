import { FilterBar } from "@/components/admin/FilterBar";
import { BookingTable, Panel, ServiceTabs } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { bookingSearchFilter } from "@/lib/search";
import { serviceCounts } from "@/lib/serviceCounts";
import { STATUSES, isServicePackage, isStatus, type Booking } from "@/lib/types";

type Search = { view?: string; q?: string; status?: string; service?: string };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { view, q, status } = params;
  const service = isServicePackage(params.service) ? params.service : undefined;

  /* New bookings: every Pending request, oldest first so nothing waits too long. */
  if (view === "new") {
    let query = supabase.from("bookings").select("*").eq("status", "Pending").order("created_at", { ascending: true });
    if (service) query = query.eq("service_package", service);
    const [{ data }, counts] = await Promise.all([query, serviceCounts(supabase, ["Pending"])]);
    const rows = (data ?? []) as Booking[];
    return (
      <>
        <ServiceTabs basePath="/admin/bookings" params={{ view: "new", service }} counts={counts} />
        <Panel
          title={service ? `Waiting for review · ${service}` : "Waiting for review"}
          action={<span className="text-sm text-muted">{rows.length} {rows.length === 1 ? "request" : "requests"}</span>}
        >
          <BookingTable bookings={rows} columns={["client", "package", "event", "date", "submitted"]} empty="No new booking requests." />
        </Panel>
      </>
    );
  }

  /* All bookings with search and filters. */
  let query = supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(500);
  if (isStatus(status)) query = query.eq("status", status);
  if (service) query = query.eq("service_package", service);
  const filter = bookingSearchFilter(q);
  if (filter) query = query.or(filter);

  const [{ data, error }, counts] = await Promise.all([query, serviceCounts(supabase)]);
  const rows = (data ?? []) as Booking[];

  return (
    <>
      <ServiceTabs basePath="/admin/bookings" params={{ q, status, service }} counts={counts} />
      <Panel>
        <FilterBar
          placeholder="Search name, email or event…"
          selects={[
            { name: "status", label: "Filter by status", options: [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))] },
          ]}
        />
        {error && <p className="px-5 py-4 text-danger">Couldn&apos;t load bookings: {error.message}</p>}
        <BookingTable bookings={rows} columns={["client", "package", "event", "date", "status", "submitted"]} empty="No bookings match." />
      </Panel>
    </>
  );
}
