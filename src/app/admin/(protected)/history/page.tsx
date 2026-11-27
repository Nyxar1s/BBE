import { FilterBar } from "@/components/admin/FilterBar";
import { BookingTable, Panel, ServiceTabs } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { bookingSearchFilter } from "@/lib/search";
import { serviceCounts } from "@/lib/serviceCounts";
import { PAST_STATUSES, isServicePackage, type Booking, type BookingStatus } from "@/lib/types";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; service?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { q, status } = params;
  const service = isServicePackage(params.service) ? params.service : undefined;

  let query = supabase.from("bookings").select("*").order("updated_at", { ascending: false }).limit(500);
  query = PAST_STATUSES.includes(status as BookingStatus) ? query.eq("status", status!) : query.in("status", PAST_STATUSES);
  if (service) query = query.eq("service_package", service);
  const filter = bookingSearchFilter(q);
  if (filter) query = query.or(filter);

  const [{ data }, counts] = await Promise.all([query, serviceCounts(supabase, PAST_STATUSES)]);

  return (
    <>
      <ServiceTabs basePath="/admin/history" params={{ q, status, service }} counts={counts} />
      <Panel>
        <FilterBar
          placeholder="Search past bookings…"
          selects={[
            {
              name: "status",
              label: "Filter by status",
              options: [{ value: "", label: "Completed, rejected & cancelled" }, ...PAST_STATUSES.map((s) => ({ value: s, label: s }))],
            },
          ]}
        />
        <BookingTable bookings={(data ?? []) as Booking[]} columns={["client", "package", "event", "date", "status", "updated"]} empty="No past bookings yet." />
      </Panel>
    </>
  );
}
