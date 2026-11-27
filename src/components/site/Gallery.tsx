"use client";

import { useState } from "react";

type Photo = { image_url: string; caption: string; description: string | null };

const INITIAL = 6;
const STEP = 6;

export function Gallery({ photos }: { photos: Photo[] }) {
  const [visible, setVisible] = useState(INITIAL);

  return (
    <>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {photos.slice(0, visible).map((p, i) => (
          <figure key={`${p.image_url}-${i}`} data-reveal style={{ "--reveal-delay": `${(i % 3) * 110}ms` } as React.CSSProperties} className="group">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url}
                alt={p.caption || "BBE event"}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-gold transition group-hover:ring-2" />
            </div>
            <figcaption className="mt-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[17px] font-bold tracking-tight">{p.caption}</div>
                <div className="truncate text-[13px] text-muted">{p.description || "By BBE"}</div>
              </div>
              <span className="shrink-0 rounded-full border border-gold/50 px-2.5 py-0.5 text-[11px] font-semibold text-gold-strong">
                BBE
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {photos.length > INITIAL && (
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {visible < photos.length && (
            <button type="button" className="rounded-xl bg-fg dark:bg-gold dark:text-ink dark:hover:bg-gold-strong px-6 py-3 text-sm font-semibold text-bg transition hover:bg-gold hover:text-ink" onClick={() => setVisible((v) => v + STEP)}>
              View More Events
            </button>
          )}
          {visible > INITIAL && (
            <button
              type="button"
              className="rounded-xl border border-gold/60 px-6 py-3 text-sm font-semibold text-gold-strong transition hover:bg-gold/10"
              onClick={() => {
                setVisible(INITIAL);
                document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Less
            </button>
          )}
        </div>
      )}
    </>
  );
}
