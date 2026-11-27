export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
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
