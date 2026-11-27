"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginToEmail } from "@/lib/format";
import { getBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const { error } = await getBrowserClient().auth.signInWithPassword({
      email: loginToEmail(String(form.get("login"))),
      password: String(form.get("password")),
    });
    if (error) {
      setBusy(false);
      setError(error.message.includes("Invalid") ? "Incorrect username or password." : error.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2.5 text-[13.5px] text-danger">{error}</div>}
      <label className="mb-4 block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Username or email</span>
        <input name="login" type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} className="field" />
      </label>
      <label className="mb-5 block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      <button type="submit" disabled={busy} className="btn-gold w-full rounded-md py-3 text-xs tracking-[0.18em] uppercase">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
