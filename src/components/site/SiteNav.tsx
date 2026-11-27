"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#process", label: "How It Works" },
  { href: "/#services", label: "Services" },
  { href: "/#gallery", label: "Our Events" },
  { href: "#contact", label: "Contact" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="BBE logo" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" priority />
          <span className="text-[19px] font-extrabold tracking-tight text-fg">
            BBE
          </span>
        </Link>

        <ul
          className={`${open ? "flex" : "hidden"} absolute top-[72px] left-0 w-full flex-col gap-4 border-b border-line bg-surface p-6 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="text-[14.5px] font-medium text-fg/80 transition hover:text-gold">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/book"
            className="hidden rounded-xl bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-gold hover:text-ink sm:inline-flex dark:bg-gold dark:text-ink dark:hover:bg-gold-strong"
          >
            Book Now
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-fg text-bg md:hidden dark:bg-gold dark:text-ink"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
