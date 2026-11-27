import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/env";
import { bookingHref } from "@/lib/services";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-line bg-surface px-4 pt-14 pb-8 text-[14px] text-muted sm:px-6">
      <div className="mx-auto grid max-w-[1100px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="rounded-lg" />
            <span className="text-[19px] font-extrabold tracking-tight text-fg">
              BBE <span className="text-gold">Events</span>
            </span>
          </div>
          <p className="mt-3 max-w-[300px]">Helping couples and clients turn their event ideas into memorable celebrations.</p>
        </div>
        <div>
          <h3 className="mb-3 font-sans text-[13px] font-bold tracking-[0.14em] text-fg uppercase">Services</h3>
          <ul className="space-y-2">
            <li><Link href={bookingHref("Full Service")} className="hover:text-gold">Full Service</Link></li>
            <li><Link href={bookingHref("Half Service")} className="hover:text-gold">Half Service</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-sans text-[13px] font-bold tracking-[0.14em] text-fg uppercase">Explore</h3>
          <ul className="space-y-2">
            <li><Link href="/#process" className="hover:text-gold">How It Works</Link></li>
            <li><Link href="/#services" className="hover:text-gold">Services</Link></li>
            <li><Link href="/#gallery" className="hover:text-gold">Our Events</Link></li>
            <li><Link href="/book" className="hover:text-gold">Book Now</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-sans text-[13px] font-bold tracking-[0.14em] text-fg uppercase">Contact</h3>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold" />
              <a href={`mailto:${BUSINESS.email}`} className="hover:text-gold">{BUSINESS.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold" />
              {BUSINESS.phone}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gold" />
              {BUSINESS.location}
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1100px] border-t border-line pt-6 text-center">© {new Date().getFullYear()} BBE. All Rights Reserved.</p>
    </footer>
  );
}
