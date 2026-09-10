import { KELLY_CAP, KELLY_FRACTION, PAPER_BANKROLL } from "./flags";

export type KellyTicket = {
  p: number;
  b: number;
  q: number;
  full: number;
  quarter: number;
  sized: number;
  bankroll: number;
};

/**
 * Quarter-Kelly with a 5% bankroll cap. Paper only.
 * f* = (b p - q) / b ; size = min(0.25 f*, 0.05) * bankroll, floored at 0.
 */
export function quarterKelly(
  p: number,
  b: number,
  bankroll = PAPER_BANKROLL,
): KellyTicket {
  const q = 1 - p;
  const full = b > 0 ? (b * p - q) / b : 0;
  const quarter = full * KELLY_FRACTION;
  const capped = Math.min(Math.max(quarter, 0), KELLY_CAP);
  const sized = Math.floor(capped * bankroll);
  return { p, b, q, full, quarter, sized, bankroll };
}
