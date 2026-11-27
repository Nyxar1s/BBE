import {
  ArrowRight,
  CalendarCheck,
  Check,
  Handshake,
  MessageCircleHeart,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Gallery } from "@/components/site/Gallery";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { HERO_IMAGE, PROCESS_STEPS, SAMPLE_PHOTOS, SERVICES } from "@/lib/content";
import { isSupabaseConfigured } from "@/lib/env";
import { revealDelay } from "@/lib/reveal";
import { bookingHref } from "@/lib/services";
import { createPublicClient } from "@/lib/supabase/server";

// Rebuild the page at most every 5 minutes. Gallery changes in the admin also refresh it immediately.
export const revalidate = 300;

async function getPublishedPhotos() {
  if (!isSupabaseConfigured) return SAMPLE_PHOTOS;
  const { data, error } = await createPublicClient()
    .from("gallery")
    .select("image_url, caption, description")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("uploaded_at", { ascending: false });
  if (error) console.error("Gallery load failed:", error);
  return data && data.length ? data : SAMPLE_PHOTOS;
}

const STEP_ICONS: LucideIcon[] = [Search, MessageCircleHeart, Handshake, CalendarCheck];

const darkBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:bg-gold hover:text-ink dark:bg-gold dark:text-ink dark:hover:bg-gold-strong";

function SectionTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div data-reveal className="mx-auto mb-10 max-w-[640px] text-center">
      {eyebrow && <span className="text-[12px] font-bold tracking-[0.2em] text-gold uppercase">{eyebrow}</span>}
      <h2 className="mt-2 font-sans text-[30px] leading-tight font-extrabold tracking-tight sm:text-[36px]">{title}</h2>
      {text && <p className="mt-3 text-[15.5px] text-muted">{text}</p>}
    </div>
  );
}

export default async function HomePage() {
  const photos = await getPublishedPhotos();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <ScrollReveal />
      <SiteNav />

      <main>
        {/* ---------------- HERO ---------------- */}
        <section id="home" className="relative">
          <div className="relative isolate flex min-h-[500px] items-center justify-center overflow-hidden px-4 py-20 text-center sm:min-h-[580px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
            <div className="max-w-[780px] text-white">
              <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-semibold tracking-[0.18em] text-[#f3d98a] uppercase backdrop-blur-sm">
                We Create. You Celebrate.
              </span>
              <h1 className="mt-5 font-sans text-[38px] leading-[1.1] font-extrabold tracking-tight drop-shadow-sm sm:text-[56px]">
                Plan Weddings, Debuts &amp; Celebrations <span className="text-[#f0d27a]">with Ease</span>
              </h1>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] text-white/85">
                From planning to the final celebration, we help couples create an event that feels truly theirs.
              </p>
              <a
                href="#services"
                className="mt-8 inline-flex rounded-full border-2 border-white/80 px-7 py-2.5 text-sm font-semibold text-white transition hover:border-[#f0d27a] hover:bg-white/10"
              >
                Explore Services
              </a>
            </div>
          </div>

        </section>

        {/* ---------------- 1. HOW IT WORKS ---------------- */}
        <section id="process" className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="The Process" title="How It Works" text="A simple way to start planning your event." />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((s, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <li key={s.title} data-reveal style={revealDelay(i)} className="lux-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-gold/40">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </span>
                    <span className="text-[32px] leading-none font-extrabold text-gold/25">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-sans text-[18px] font-bold">{s.title}</h3>
                  <p className="mt-1 text-[14px] text-muted">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---------------- 2. SERVICES ---------------- */}
        <section id="services" className="bg-secondary py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
            <SectionTitle eyebrow="What We Offer" title="Choose Your Service" text="Two ways to work with us. Pick one to start your booking." />
            <div className="grid gap-8 md:grid-cols-2">
              {SERVICES.map((s, i) => (
                <article key={s.name} data-reveal style={revealDelay(i, 2)} className="lux-card flex flex-col overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt={`${s.name} event`} loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#f3d98a] uppercase backdrop-blur-sm">
                      {s.subtitle}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-sans text-[22px] font-extrabold tracking-tight">{s.name}</h3>
                      <div className="text-right">
                        <div className="text-[22px] leading-none font-extrabold text-gold-strong">₱{s.price}</div>
                        <div className="mt-1 text-[11px] text-muted">starting price</div>
                      </div>
                    </div>
                    <p className="mt-2 text-[14.5px] text-muted">{s.summary}</p>
                    <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">
                      <Users className="h-4 w-4 text-gold" />
                      Head coordinator with 5–7 assistants on the day
                    </div>

                    <details className="group mt-5 rounded-xl border border-line text-left open:border-gold/50">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-semibold [&::-webkit-details-marker]:hidden">
                        What&apos;s included
                        <span className="text-gold transition group-open:rotate-45">＋</span>
                      </summary>
                      <div className="space-y-4 px-4 pt-1 pb-4">
                        <p className="text-[13.5px] text-muted">
                          {s.lead}
                          {s.leadStrong && (
                            <>
                              {" "}
                              <strong className="text-fg">{s.leadStrong}</strong>.
                            </>
                          )}
                        </p>
                        {(
                          [
                            ["Planning includes", s.planning],
                            ["On your wedding day", s.weddingDay],
                          ] as const
                        ).map(([label, items]) => (
                          <div key={label}>
                            <span className="mb-1.5 block text-[11px] font-bold tracking-[0.14em] text-gold uppercase">{label}</span>
                            <ul className="space-y-1">
                              {items.map((item) => (
                                <li key={item} className="flex gap-2 text-[13.5px] text-fg/85">
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </details>

                    <Link href={bookingHref(s.name)} className={`${darkBtn} mt-6 w-full`}>
                      Book {s.name} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- 3. PORTFOLIO ---------------- */}
        <section id="gallery" className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Portfolio" title="Our Previous Events" text="See some of the celebrations we have helped create." />
          <Gallery photos={photos} />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
