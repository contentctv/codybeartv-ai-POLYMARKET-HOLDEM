import type { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["s", "h", "d", "c"];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const RANK_LABEL: Record<Rank, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "T",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

export const SUIT_GLYPH: Record<Suit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

export function isRed(suit: Suit): boolean {
  return suit === "h" || suit === "d";
}

export function cardKey(c: Card): string {
  return `${RANK_LABEL[c.rank]}${c.suit}`;
}

export function freshDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) d.push({ rank, suit });
  }
  return d;
}

export function shuffle(deck: Card[], rng: () => number = Math.random): Card[] {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export function draw(deck: Card[]): Card {
  const c = deck.pop();
  if (!c) throw new Error("Deck empty");
  return c;
}
