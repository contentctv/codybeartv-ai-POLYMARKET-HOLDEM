import type { Card, Rank } from "./types";

const CAT = {
  HIGH: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  TRIPS: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL: 6,
  QUADS: 7,
  STRAIGHT_FLUSH: 8,
} as const;

function pack(cat: number, a = 0, b = 0, c = 0, d = 0, e = 0): number {
  return (((((cat * 16 + a) * 16 + b) * 16 + c) * 16 + d) * 16 + e);
}

function isStraight(ranks: number[]): number | null {
  const uniq = [...new Set(ranks)].sort((x, y) => y - x);
  if (uniq.includes(14)) uniq.push(1);
  for (let i = 0; i <= uniq.length - 5; i++) {
    const hi = uniq[i]!;
    if (
      uniq[i + 1] === hi - 1 &&
      uniq[i + 2] === hi - 2 &&
      uniq[i + 3] === hi - 3 &&
      uniq[i + 4] === hi - 4
    ) {
      return hi === 14 && uniq[i + 4] === 10 ? 14 : hi;
    }
  }
  return null;
}

export function evalFive(cards: Card[]): number {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);
  const counts = new Map<Rank, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const straightHi = isStraight(ranks);

  if (flush && straightHi) return pack(CAT.STRAIGHT_FLUSH, straightHi);
  if (groups[0]?.[1] === 4) return pack(CAT.QUADS, groups[0][0], groups[1]?.[0] ?? 0);
  if (groups[0]?.[1] === 3 && groups[1]?.[1] === 2) {
    return pack(CAT.FULL, groups[0][0], groups[1][0]);
  }
  if (flush) return pack(CAT.FLUSH, ranks[0], ranks[1], ranks[2], ranks[3], ranks[4]);
  if (straightHi) return pack(CAT.STRAIGHT, straightHi);
  if (groups[0]?.[1] === 3) {
    const kick = groups.slice(1).map((g) => g[0]);
    return pack(CAT.TRIPS, groups[0][0], kick[0] ?? 0, kick[1] ?? 0);
  }
  if (groups[0]?.[1] === 2 && groups[1]?.[1] === 2) {
    const hi = Math.max(groups[0][0], groups[1][0]);
    const lo = Math.min(groups[0][0], groups[1][0]);
    return pack(CAT.TWO_PAIR, hi, lo, groups[2]?.[0] ?? 0);
  }
  if (groups[0]?.[1] === 2) {
    const kick = groups.slice(1).map((g) => g[0]);
    return pack(CAT.PAIR, groups[0][0], kick[0] ?? 0, kick[1] ?? 0, kick[2] ?? 0);
  }
  return pack(CAT.HIGH, ranks[0], ranks[1], ranks[2], ranks[3], ranks[4]);
}

function combos<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push(acc.slice());
      return;
    }
    for (let i = start; i < arr.length; i++) {
      acc.push(arr[i]!);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(0, []);
  return out;
}

export function evalSeven(hole: [Card, Card], board: Card[]): number {
  const all = [...hole, ...board];
  if (all.length < 5) return 0;
  if (all.length === 5) return evalFive(all);
  let best = 0;
  for (const five of combos(all, 5)) {
    const s = evalFive(five);
    if (s > best) best = s;
  }
  return best;
}

export function categoryName(score: number): string {
  const cat = Math.floor(score / 16 ** 5);
  return [
    "High card",
    "Pair",
    "Two pair",
    "Three of a kind",
    "Straight",
    "Flush",
    "Full house",
    "Four of a kind",
    "Straight flush",
  ][cat] ?? "Hand";
}

export function describeHand(hole: [Card, Card], board: Card[]): string {
  return categoryName(evalSeven(hole, board));
}
