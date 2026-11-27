"use client";

import { useLayoutEffect } from "react";

/**
 * Fades in every element marked with `data-reveal` the first time it scrolls into view.
 * Each element animates once; scrolling back up doesn't replay it.
 */
export function ScrollReveal() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-reveal-ready", "");
    (window as unknown as { __revealReady?: boolean }).__revealReady = true;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    const scan = () => document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => io.observe(el));
    scan();

    // Picks up gallery photos added by "View More Events".
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}

