"use client";

import { Check, Gem, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitBooking, type BookingFormState } from "@/app/actions";
import { Scheduler } from "@/components/site/Scheduler";
import { SERVICES } from "@/lib/content";
import { BUDGET_RANGES, SERVICE_FORM_COPY, SERVICE_SLUGS, SUPPLIER_TYPES, VENUE_STATUSES } from "@/lib/services";
import { EVENT_TYPES, MEETING_LOCATIONS, SERVICE_PACKAGES, type ServicePackage } from "@/lib/types";

const TAB_ICON = { "Full Service": Gem, "Half Service": Sparkles } as const;

/**
 * Booking page body: pick a service (cards), then fill in that service's own form.
 * Both forms stay mounted so switching doesn't lose what the client typed.
 */
export function BookingForms({ schedulingUrl, initialService }: { schedulingUrl: string; initialService: ServicePackage }) {
  const [active, setActive] = useState<ServicePackage>(initialService);
  const router = useRouter();
  const pathname = usePathname();
  const info = SERVICES.find((s) => s.name === active)!;

  function select(s: ServicePackage) {
    setActive(s);
    router.replace(`${pathname}?service=${SERVICE_SLUGS[s]}`, { scroll: false });
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
      <div className="lux-panel p-5 sm:p-9">
        <div role="tablist" aria-label="Choose a service" className="mb-8 grid grid-cols-2 gap-3">
          {SERVICE_PACKAGES.map((s) => {
            const Icon = TAB_ICON[s];
            const selected = s === active;
            const price = SERVICES.find((x) => x.name === s)?.price;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                id={`tab-${s}`}
                aria-selected={selected}
                aria-controls={`panel-${s}`}
                onClick={() => select(s)}
                className={`relative flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition ${
                  selected ? "border-gold bg-gold/10" : "border-line hover:border-gold/50"
                }`}
              >
                {selected && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}
                <Icon className={`h-5 w-5 ${selected ? "text-gold" : "text-muted"}`} />
                <span className="mt-1 text-[15px] font-bold">{s}</span>
                <span className="text-[13px] text-muted">from ₱{price}</span>
              </button>
            );
          })}
        </div>

        {SERVICE_PACKAGES.map((s) => (
          <div key={s} role="tabpanel" id={`panel-${s}`} aria-labelledby={`tab-${s}`} hidden={s !== active}>
            <ServiceForm service={s} schedulingUrl={schedulingUrl} />
          </div>
        ))}
      </div>

      {/* Summary of the selected service */}
      <aside className="lux-panel overflow-hidden lg:sticky lg:top-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={info.image} alt="" className="aspect-[16/10] w-full object-cover" />
        <div className="p-5">
          <span className="text-[11px] font-bold tracking-[0.16em] text-gold uppercase">{info.subtitle}</span>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <h2 className="font-sans text-xl font-extrabold tracking-tight">{info.name}</h2>
            <span className="text-lg font-extrabold text-gold-strong">₱{info.price}</span>
          </div>
          <p className="mt-2 text-[13.5px] text-muted">{info.summary}</p>
          <span className="mt-4 mb-2 block text-[11px] font-bold tracking-[0.14em] text-gold uppercase">Planning includes</span>
          <ul className="space-y-1.5">
            {info.planning.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] text-fg/85">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-secondary px-3 py-2.5 text-[12.5px] text-muted">
            Submitting this form sends a request, not a confirmed booking. We&apos;ll email you to agree on the details first.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Req() {
  return <span className="ml-0.5 text-gold">*</span>;
}

function ServiceForm({ service, schedulingUrl }: { service: ServicePackage; schedulingUrl: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<BookingFormState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [minDate, setMinDate] = useState<string>();
  const id = (name: string) => `${service === "Full Service" ? "full" : "half"}-${name}`;
  const copy = SERVICE_FORM_COPY[service];

  useEffect(() => setMinDate(new Date().toLocaleDateString("en-CA")), []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitBooking(data);
      setState(result);
      if (result.status === "success") {
        formRef.current?.reset();
        requestAnimationFrame(() =>
          document.getElementById(id("confirmation"))?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      } else {
        requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]")?.focus());
      }
    });
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const err = (name: string) =>
    errors[name] ? (
      <p id={id(`${name}-error`)} className="mt-1 text-[13px] text-danger">
        {errors[name]}
      </p>
    ) : null;
  const a11y = (name: string) => (errors[name] ? { "aria-invalid": true, "aria-describedby": id(`${name}-error`) } : {});

  if (state.status === "success") {
    return (
      <div id={id("confirmation")} role="status" aria-live="polite" className="px-2 py-6 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-strong to-gold text-3xl text-ink shadow-[0_6px_18px_var(--gold-glow)]">
          ✓
        </div>
        <h3 className="mb-2.5 font-sans text-[28px] font-bold tracking-tight">Thank you, {state.name.split(" ")[0]}!</h3>
        <p className="mx-auto mb-2.5 max-w-[520px] text-muted">
          We&apos;ve received your <strong className="text-fg">{service}</strong> request. It is now{" "}
          <strong className="text-fg">pending review</strong>.
        </p>
        {state.email && (
          <p className="mx-auto max-w-[520px] text-muted">
            Our team will contact you at <strong className="text-fg">{state.email}</strong> to discuss your event and confirm the
            arrangements.
          </p>
        )}
        {schedulingUrl && state.email && (
          <div className="mt-8 text-left">
            <h4 className="mb-1 text-center text-xl font-bold">Want to lock in a meeting time now?</h4>
            <p className="mb-4 text-center text-sm text-muted">Optional: pick a consultation slot that works for you.</p>
            <Scheduler url={schedulingUrl} name={state.name} email={state.email} />
          </div>
        )}
        <button
          type="button"
          className="mt-6 rounded-xl border border-gold/60 px-5 py-2.5 text-sm font-semibold text-gold-strong transition hover:bg-gold/10"
          onClick={() => setState({ status: "idle" })}
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <input type="hidden" name="service_package" value={service} />

      <div className="mb-6">
        <h3 className="font-sans text-2xl font-bold tracking-tight">{copy.title}</h3>
        <p className="mt-1 text-[14.5px] text-muted">{copy.intro}</p>
        <p className="mt-2 text-[13px] text-muted">
          Fields marked <span className="text-gold">*</span> are required. No account needed.
        </p>
      </div>

      {state.status === "error" && (
        <div role="alert" tabIndex={-1} className="mb-5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger outline-none">
          {state.message}
        </div>
      )}

      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="mb-2">
        <legend className="mb-3 text-[11px] font-bold tracking-[0.16em] text-gold uppercase">Your details</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <div className="mb-4">
            <label className="label" htmlFor={id("full_name")}>Full Name<Req /></label>
            <input id={id("full_name")} name="full_name" className="field" required maxLength={120} autoComplete="name" placeholder="Your name" {...a11y("full_name")} />
            {err("full_name")}
          </div>
          <div className="mb-4">
            <label className="label" htmlFor={id("email")}>Email Address<Req /></label>
            <input id={id("email")} name="email" type="email" className="field" required maxLength={254} autoComplete="email" placeholder="you@email.com" {...a11y("email")} />
            {err("email")}
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-2">
        <legend className="mb-3 text-[11px] font-bold tracking-[0.16em] text-gold uppercase">Your event</legend>
        <div className="grid gap-x-4 sm:grid-cols-3">
          <div className="mb-4">
            <label className="label" htmlFor={id("event_type")}>Event Type<Req /></label>
            <select id={id("event_type")} name="event_type" className="field" required defaultValue="" {...a11y("event_type")}>
              <option value="" disabled>Select event</option>
              {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            {err("event_type")}
          </div>
          <div className="mb-4">
            <label className="label" htmlFor={id("event_date")}>Preferred Event Date<Req /></label>
            <input id={id("event_date")} name="event_date" type="date" className="field" required min={minDate} {...a11y("event_date")} />
            {err("event_date")}
          </div>
          <div className="mb-4">
            <label className="label" htmlFor={id("guest_count")}>Number of Guests</label>
            <input id={id("guest_count")} name="guest_count" type="number" min={1} max={100000} className="field" placeholder="Approximate" {...a11y("guest_count")} />
            {err("guest_count")}
          </div>
        </div>
      </fieldset>

      {/* ---------- Service-specific questions ---------- */}
      <fieldset className="mb-6 rounded-2xl border border-gold/35 bg-gold/[0.05] p-4 sm:p-5">
        <legend className="px-2 text-[11px] font-bold tracking-[0.16em] text-gold uppercase">{service} details</legend>

        {service === "Full Service" ? (
          <div className="grid gap-x-4 sm:grid-cols-2">
            <div className="mb-4">
              <label className="label" htmlFor={id("budget")}>Estimated Budget<Req /></label>
              <select id={id("budget")} name="budget" className="field" required defaultValue="" {...a11y("budget")}>
                <option value="" disabled>Select a range</option>
                {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
              </select>
              {err("budget")}
            </div>
            <div className="mb-4">
              <label className="label" htmlFor={id("venue_status")}>Venue<Req /></label>
              <select id={id("venue_status")} name="venue_status" className="field" required defaultValue="" {...a11y("venue_status")}>
                <option value="" disabled>Have you booked a venue?</option>
                {VENUE_STATUSES.map((v) => <option key={v}>{v}</option>)}
              </select>
              {err("venue_status")}
            </div>
            <div className="mb-1 sm:col-span-2">
              <label className="label" htmlFor={id("theme")}>Theme / Motif</label>
              <input id={id("theme")} name="theme" className="field" maxLength={200} placeholder="e.g. Garden, rustic, white & gold" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4" role="group" aria-labelledby={id("suppliers-label")} {...a11y("booked_suppliers")}>
              <p id={id("suppliers-label")} className="label">
                Suppliers you&apos;ve already booked<Req />
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SUPPLIER_TYPES.map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] transition has-[:checked]:border-gold has-[:checked]:bg-gold/10"
                  >
                    <input type="checkbox" name="booked_suppliers" value={s} className="h-4 w-4 accent-gold" />
                    {s}
                  </label>
                ))}
              </div>
              {err("booked_suppliers")}
            </div>
            <div className="mb-1">
              <label className="label" htmlFor={id("remaining_help")}>What do you still need help with?</label>
              <textarea id={id("remaining_help")} name="remaining_help" maxLength={1000} className="field min-h-[80px] resize-y" placeholder="e.g. Still need a florist and help with purchases" />
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="mb-2">
        <legend className="mb-3 text-[11px] font-bold tracking-[0.16em] text-gold uppercase">Meeting preference</legend>
        <div className="grid gap-x-4 sm:grid-cols-3">
          <div className="mb-4">
            <label className="label" htmlFor={id("meeting_date")}>Meeting Date</label>
            <input id={id("meeting_date")} name="meeting_date" type="date" className="field" min={minDate} {...a11y("meeting_date")} />
            {err("meeting_date")}
          </div>
          <div className="mb-4">
            <label className="label" htmlFor={id("meeting_time")}>Meeting Time</label>
            <input id={id("meeting_time")} name="meeting_time" type="time" className="field" {...a11y("meeting_time")} />
            {err("meeting_time")}
          </div>
          <div className="mb-4">
            <label className="label" htmlFor={id("meeting_location")}>Location / Platform</label>
            <select id={id("meeting_location")} name="meeting_location" className="field" defaultValue="">
              <option value="">No preference</option>
              {MEETING_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="mb-6">
        <label className="label" htmlFor={id("details")}>Additional Details</label>
        <textarea id={id("details")} name="details" maxLength={5000} className="field min-h-[110px] resize-y" placeholder="Anything else we should know: venue, ideas, questions…" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-br from-gold-strong to-gold py-4 text-[15px] font-bold text-ink shadow-[0_6px_18px_var(--gold-glow)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Sending…" : `Submit ${service} Request`}
      </button>
    </form>
  );
}
