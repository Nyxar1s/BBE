import type { CSSProperties } from "react";

/** Stagger delay for the i-th item in a row of `perRow` items (used with `data-reveal`). */
export function revealDelay(i: number, perRow = 4): CSSProperties {
  return { "--reveal-delay": `${(i % perRow) * 110}ms` } as CSSProperties;
}
