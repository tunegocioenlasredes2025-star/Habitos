import { QUOTES } from "./constants";

/** Deterministic quote for a given date (same all day, changes daily). */
export function quoteOfDay(d = new Date()): { text: string; author: string } {
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}
