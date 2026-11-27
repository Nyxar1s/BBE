/**
 * The Supabase project address, e.g. https://abcd.supabase.co.
 * Supabase's dashboard also shows the REST endpoint (…/rest/v1/); if that was pasted,
 * keep only the origin so the client libraries don't end up calling /rest/v1/rest/v1.
 */
export const SUPABASE_URL = toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR-PROJECT") &&
  SUPABASE_ANON_KEY.length > 20;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SCHEDULING_URL = process.env.NEXT_PUBLIC_SCHEDULING_URL || "";

export const BUSINESS = {
  name: "BBE",
  email: "hello@bbeevents.com",
  phone: "+63 900 000 0000",
  location: "Cagayan de Oro City, Philippines",
};

function toOrigin(value: string) {
  const trimmed = value.trim();
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}
