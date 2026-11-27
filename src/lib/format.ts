// Dates are shown in Philippine time regardless of where the server runs.
const TZ = "Asia/Manila";
const LOCALE = "en-PH";

/** "2027-03-22" → "Mar 22, 2027" (date-only values have no timezone). */
export function formatDate(ymd: string | null | undefined): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "14:30:00" → "2:30 PM" */
export function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** ISO timestamp → "Nov 21, 2026, 12:38 PM" in Manila time */
export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/** ISO timestamp → "2 h ago" */
export function formatAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return formatStamp(iso).split(",").slice(0, 2).join(",");
}

/** Today's date in Manila as YYYY-MM-DD. */
export function todayYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/**
 * Admins can sign in with a plain username. Supabase needs an email,
 * so "admin123" is stored as "admin123@bbe-admin.local".
 */
export const ADMIN_USERNAME_DOMAIN = "bbe-admin.local";

export function loginToEmail(login: string): string {
  const v = login.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${ADMIN_USERNAME_DOMAIN}`;
}

/** Shows "admin123" instead of "admin123@bbe-admin.local". */
export function adminDisplayName(email: string | null | undefined): string {
  if (!email) return "";
  return email.endsWith(`@${ADMIN_USERNAME_DOMAIN}`) ? email.slice(0, -ADMIN_USERNAME_DOMAIN.length - 1) : email;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}
