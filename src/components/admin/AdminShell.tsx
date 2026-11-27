"use client";

import { ExternalLink, Images, Inbox, LayoutDashboard, ListChecks, LogOut, Menu, RefreshCw, History, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { signOut } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = { href: string; label: string; title: string; icon: LucideIcon; badge?: boolean };

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", title: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings?view=new", label: "New Bookings", title: "New Bookings", icon: Inbox, badge: true },
  { href: "/admin/bookings", label: "All Bookings", title: "All Bookings", icon: ListChecks },
  { href: "/admin/history", label: "Booking History", title: "Booking History", icon: History },
  { href: "/admin/gallery", label: "Gallery Management", title: "Gallery Management", icon: Images },
];

function useActiveNav(): NavItem {
  const pathname = usePathname();
  const params = useSearchParams();
  if (pathname === "/admin") return NAV[0];
  if (pathname.startsWith("/admin/bookings/")) return { ...NAV[2], title: "Booking Details" };
  if (pathname === "/admin/bookings") return params.get("view") === "new" ? NAV[1] : NAV[2];
  if (pathname.startsWith("/admin/history")) return NAV[3];
  if (pathname.startsWith("/admin/gallery")) return NAV[4];
  return NAV[0];
}

function Shell({ email, pendingCount, children }: { email: string; pendingCount: number; children: React.ReactNode }) {
  const active = useActiveNav();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  useEffect(() => setMenuOpen(false), [pathname]);

  // Pick up new bookings when the admin comes back to the tab.
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  return (
    <div className="min-h-screen bg-bg text-fg md:grid md:grid-cols-[250px_1fr]">
      {menuOpen && <div className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* ---------- Sidebar ---------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col gap-1 overflow-hidden border-r border-gold/25 bg-surface px-3.5 py-5 transition-transform md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0 ${
          menuOpen ? "translate-x-0 shadow-[10px_0_40px_rgba(0,0,0,.6)]" : "-translate-x-full"
        }`}
      >

        <div className="relative mb-2 flex items-center gap-2.5 px-2">
          <Image src="/logo.png" alt="" width={40} height={40} className="rounded-md border border-gold/40" />
          <div>
            <b className="gold-text block font-serif text-[20px] leading-tight">BBE</b>
            <small className="text-[10px] tracking-[0.2em] text-muted uppercase">Admin Dashboard</small>
          </div>
        </div>
        <div className="gold-rule relative mb-4" />

        <nav className="relative flex flex-col gap-1">
          {NAV.map((item) => {
            const isActive = item.label === active.label;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[14px] transition ${
                  isActive
                    ? "border-gold/50 bg-gradient-to-r from-gold/20 to-transparent font-semibold text-gold-strong"
                    : "border-transparent text-muted hover:border-gold/20 hover:bg-gold/5 hover:text-fg"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-gold" : "text-muted group-hover:text-gold"}`} strokeWidth={1.6} />
                <span className="flex-1">{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="min-w-[22px] rounded-full bg-gradient-to-br from-[#f0d27a] to-[#b8912f] px-1.5 text-center text-xs font-bold text-ink">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />
        <div className="gold-rule relative mb-2" />
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-muted hover:bg-gold/5 hover:text-fg"
        >
          <ExternalLink className="h-[18px] w-[18px] text-muted" strokeWidth={1.6} /> View website
        </a>
        <div className="relative px-3 py-1.5 text-[12px] break-all text-muted">
          Signed in as <span className="text-fg/80">{email}</span>
        </div>
        <form action={signOut} className="relative">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] text-muted hover:bg-gold/5 hover:text-fg"
          >
            <LogOut className="h-[18px] w-[18px] text-muted" strokeWidth={1.6} /> Logout
          </button>
        </form>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-gold/25 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/40 text-gold md:hidden"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <span className="hidden text-[10px] font-semibold tracking-[0.3em] text-gold uppercase sm:block">BBE Admin</span>
                <h1 className="gold-text text-[22px] leading-tight md:text-[28px]">{active.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="btn h-10 rounded-xl border border-gold/50 px-4 text-xs tracking-[0.14em] text-gold uppercase hover:bg-gold/10"
                disabled={refreshing}
                onClick={() => startRefresh(() => router.refresh())}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-[1280px] px-4 pt-6 pb-16 md:px-8 md:pt-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShell(props: { email: string; pendingCount: number; children: React.ReactNode }) {
  return (
    <Suspense>
      <Shell {...props} />
    </Suspense>
  );
}
