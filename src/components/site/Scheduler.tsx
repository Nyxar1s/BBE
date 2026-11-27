"use client";

/**
 * Inline Cal.com or Calendly booking page, prefilled with the client's name and email.
 * Both services accept `name` and `email` query parameters for prefilling.
 */
export function Scheduler({ url, name, email }: { url: string; name: string; email: string }) {
  let src: string;
  try {
    const u = new URL(url);
    u.searchParams.set("name", name);
    u.searchParams.set("email", email);
    if (u.hostname.endsWith("calendly.com")) {
      u.searchParams.set("embed_type", "Inline");
      u.searchParams.set("embed_domain", window.location.hostname);
      u.searchParams.set("hide_gdpr_banner", "1");
    } else {
      u.searchParams.set("embed", "true");
    }
    src = u.toString();
  } catch {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg">
      <iframe src={src} title="Schedule a meeting" className="block h-[680px] w-full" loading="lazy" />
      <p className="border-t border-line px-4 py-2 text-center text-xs text-muted">
        Not loading?{" "}
        <a href={src.replace(/([?&])embed=true&?/, "$1")} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-strong underline">
          Open the scheduler in a new tab
        </a>
      </p>
    </div>
  );
}
