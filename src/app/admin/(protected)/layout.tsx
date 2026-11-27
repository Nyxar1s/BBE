import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { adminDisplayName } from "@/lib/format";

export const metadata: Metadata = { title: "BBE Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdmin();
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pending");

  return (
    <AdminShell email={adminDisplayName(user.email)} pendingCount={count ?? 0}>
      {children}
    </AdminShell>
  );
}
