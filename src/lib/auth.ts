import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures the request comes from a logged-in user listed in the `admins` table.
 * Call it at the top of every admin page and admin server action.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("id, email").eq("id", user.id).maybeSingle();
  if (!admin) redirect("/admin/login?reason=unauthorized");

  return { supabase, user };
});
