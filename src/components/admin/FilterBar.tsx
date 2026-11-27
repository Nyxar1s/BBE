"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Select = { name: string; label: string; options: { value: string; label: string }[] };

/** Search box + dropdown filters, kept in the URL so views can be bookmarked and refreshed. */
export function FilterBar({ placeholder, selects }: { placeholder: string; selects: Select[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className={`flex flex-wrap gap-2.5 border-b border-gold/20 px-5 py-3.5 transition ${pending ? "opacity-70" : ""}`}>
      <input
        type="search"
        value={q}
        aria-label={placeholder}
        placeholder={placeholder}
        className="field min-w-[200px] flex-[1_1_240px]"
        onChange={(e) => {
          const value = e.target.value;
          setQ(value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => update("q", value.trim()), 300);
        }}
      />
      {selects.map((s) => (
        <select
          key={s.name}
          aria-label={s.label}
          className="field flex-[0_1_190px]"
          value={params.get(s.name) ?? ""}
          onChange={(e) => update(s.name, e.target.value)}
        >
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
