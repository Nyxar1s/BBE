"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBookingStatus } from "@/app/admin/actions";
import { STATUSES, type BookingStatus } from "@/lib/types";

function useSetStatus(id: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  function setStatus(status: BookingStatus) {
    if (status === "Confirmed" && !confirm("Confirm this booking? Only do this once you and the client have agreed on the arrangements.")) {
      return;
    }
    start(async () => {
      const res = await updateBookingStatus(id, status);
      setMessage(res.ok ? { text: `Marked as ${status}.` } : { text: `Couldn't update: ${res.error}`, error: true });
      if (res.ok) router.refresh();
    });
  }

  return { pending, message, setStatus };
}

export function StatusControl({ id, status }: { id: string; status: BookingStatus }) {
  const [value, setValue] = useState<BookingStatus>(status);
  const { pending, message, setStatus } = useSetStatus(id);

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <select
          aria-label="Booking status"
          className="field flex-[1_1_160px]"
          value={value}
          onChange={(e) => setValue(e.target.value as BookingStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button type="button" className="btn-gold rounded-md text-xs tracking-[0.12em] uppercase" disabled={pending || value === status} onClick={() => setStatus(value)}>
          {pending ? "Saving…" : "Update status"}
        </button>
      </div>
      {message && <p className={`mt-2.5 text-sm ${message.error ? "text-danger" : "text-ok"}`}>{message.text}</p>}
      <p className="mt-3 text-[13px] text-muted">
        Only mark a booking <strong className="text-fg">Confirmed</strong> once you and the client have agreed on the arrangements.
      </p>
    </>
  );
}

export function ContactActions({
  id,
  email,
  gmail,
  mailto,
  status,
}: {
  id: string;
  email: string;
  gmail: string;
  mailto: string;
  status: BookingStatus;
}) {
  const [emailed, setEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { pending, setStatus } = useSetStatus(id);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <a
          href={gmail}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold rounded-md text-xs tracking-[0.12em] uppercase"
          onClick={() => setEmailed(true)}
        >
          ✉ Email client in Gmail
        </a>
        <button
          type="button"
          className="btn rounded-md border border-gold/50 text-gold hover:bg-gold/10 text-xs tracking-[0.12em] uppercase"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(email);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
        >
          {copied ? "Copied ✓" : "Copy email"}
        </button>
        <a href={mailto} className="text-[12.5px] text-muted underline-offset-2 hover:text-gold hover:underline" onClick={() => setEmailed(true)}>
          Other email app
        </a>
      </div>
      {emailed && status === "Pending" && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          Emailed them?
          <button type="button" className="btn rounded-md border border-gold/50 text-gold hover:bg-gold/10 btn-sm" disabled={pending} onClick={() => setStatus("Contacted")}>
            Mark as Contacted
          </button>
        </p>
      )}
    </>
  );
}
