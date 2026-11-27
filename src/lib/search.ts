/**
 * Builds a PostgREST `or` filter for a free-text booking search.
 * Characters with special meaning in the filter syntax are removed.
 */
export function bookingSearchFilter(q: string | undefined): string | null {
  const term = (q ?? "").replace(/[,()*%\\"':.]/g, " ").trim().slice(0, 80);
  if (!term) return null;
  return ["full_name", "email", "event_type", "details"].map((col) => `${col}.ilike.*${term}*`).join(",");
}
