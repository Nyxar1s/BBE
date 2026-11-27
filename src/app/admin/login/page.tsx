import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bokeh } from "@/components/site/Bokeh";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login | BBE", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-secondary px-4 py-10 text-fg dark:bg-bg">
      <ThemeToggle className="absolute top-4 right-4" />
      <Bokeh count={90} seed={12} maxSize={70} className="-z-10 hidden dark:block" />
      <div className="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,.85)_30%,rgba(0,0,0,.35)_80%)]" />

      <div className="lux-panel w-full max-w-[410px] px-7 py-10 sm:px-9">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo.png" alt="" width={56} height={56} className="rounded-lg border border-gold/50 shadow-[0_0_24px_rgba(212,175,55,.25)]" />
          <div>
            <p className="font-script text-[34px] leading-none text-gold">BBE Events</p>
            <small className="text-[10px] tracking-[0.3em] text-muted uppercase">Admin Dashboard</small>
          </div>
        </div>
        <div className="gold-rule mb-6" />

        <h1 className="gold-text mb-1 text-center text-[28px]">Welcome back</h1>
        <p className="mb-7 text-center text-sm text-muted">Sign in to manage bookings and the gallery.</p>

        {reason === "unauthorized" && (
          <div className="mb-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger">
            This account isn&apos;t authorized to use the admin dashboard.
          </div>
        )}

        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <div className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger">
            The dashboard isn&apos;t connected to Supabase yet. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart the site.
          </div>
        )}

        <Link href="/" className="mt-6 block text-center text-[12px] tracking-[0.16em] text-muted uppercase hover:text-gold">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
