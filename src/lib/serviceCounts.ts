import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { BookingStatus, ServicePackage } from "@/lib/types";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Booking counts per service (and in total) for the filter tabs. */
export async function serviceCounts(
  supabase: Client,
  statuses?: BookingStatus[],
): Promise<Record<ServicePackage | "all", number>> {
  const count = async (service?: ServicePackage) => {
    let q = supabase.from("bookings").select("id", { count: "exact", head: true });
    if (statuses) q = q.in("status", statuses);
    if (service) q = q.eq("service_package", service);
    const { count } = await q;
    return count ?? 0;
  };
  const [all, full, half] = await Promise.all([count(), count("Full Service"), count("Half Service")]);
  return { all, "Full Service": full, "Half Service": half };
}
