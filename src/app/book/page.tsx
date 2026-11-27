import type { Metadata } from "next";
import Link from "next/link";
import { BookingForms } from "@/components/site/BookingForm";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { SCHEDULING_URL } from "@/lib/env";
import { serviceFromSlug } from "@/lib/services";

export const metadata: Metadata = {
  title: "Book Your Event | BBE Events",
  description: "Send a Full Service or Half Service booking request to BBE Events. No account needed.",
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const initialService = serviceFromSlug(service) ?? "Full Service";

  return (
    <div className="min-h-screen bg-bg text-fg">
      <SiteNav />

      <header className="border-b border-line bg-secondary">
        <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-fg">Book</span>
          </nav>
          <h1 className="mt-3 font-sans text-[32px] leading-tight font-extrabold tracking-tight sm:text-[40px]">
            Book Your <span className="text-gold">Event</span>
          </h1>
          <p className="mt-2 max-w-[620px] text-[15.5px] text-muted">
            Choose your service and fill in its form. No account needed. We&apos;ll reply by email to plan the details together.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
        <BookingForms schedulingUrl={SCHEDULING_URL} initialService={initialService} />
      </main>

      <SiteFooter />
    </div>
  );
}
