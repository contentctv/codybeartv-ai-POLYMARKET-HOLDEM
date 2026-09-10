import type { BotId, Card, PlayerAction, SeatPlayer, Street, TableState } from "./types";
import { evalSeven } from "./hand";

export const BOTS: {
  id: BotId;
  name: string;
  portrait: string;
  tagline: string;
  tightness: number;
  aggression: number;
}[] = [
  {
    id: "reed",
    name: "Reed Ember",
    portrait: "/bots/reed-ember.jpg",
    tagline: "Value-heavy TAG",
    tightness: 0.82,
    aggression: 0.62,
  },
  {
    id: "voss",
    name: "Voss Teal",
    portrait: "/bots/voss-teal.jpg",
    tagline: "Positional TAG",
    tightness: 0.74,
    aggression: 0.78,
  },
  {
    id: "marrow",
    name: "Marrow Felt",
    portrait: "/bots/marrow-felt.jpg",
    tagline: "Pot-control TAG",
    tightness: 0.8,
    aggression: 0.48,
  },
  {
    id: "finch",
    name: "Finch Cream",
    portrait: "/bots/finch-cream.jpg",
    tagline: "Thin-value TAG",
    tightness: 0.76,
    aggression: 0.58,
  },
  {
    id: "wren",
    name: "Wren Cipher",
    portrait: "/bots/wren-cipher.jpg",
    tagline: "Range-balanced TAG",
    tightness: 0.78,
    aggression: 0.7,
  },
];

function chen(hole: [Card, Card]): number {
  const [a, b] = hole[0].rank >= hole[1].rank ? hole : [hole[1], hole[0]];
  const base: Record<number, number> = {
    14: 10, 13: 8, 12: 7, 11: 6, 10: 5, 9: 4.5, 8: 4, 7: 3.5, 6: 3, 5: 2.5, 4: 2, 3: 1.5, 2: 1,
  };
  let s = base[a.rank] ?? 1;
  if (a.rank === b.rank) s = Math.max(s * 2, 5);
  if (a.suit === b.suit) s += 2;
  const gap = a.rank - b.rank;
  if (gap === 1) s += 1;
  else if (gap === 2) s -= 1;
  else if (gap === 3) s -= 2;
  else if (gap >= 4) s -= 3;
  if (gap <= 1 && a.rank < 12) s += 1;
  return s;
}

function legal(state: TableState, p: SeatPlayer): PlayerAction[] {
  const toCall = state.currentBet - p.betStreet;
  const out: PlayerAction[] = [{ type: "fold" }];
  if (toCall <= 0) out.push({ type: "check" });
  if (toCall > 0 && p.stack > 0) {
    const call = Math.min(toCall, p.stack);
    out.push(call >= p.stack ? { type: "allin", amount: p.stack } : { type: "call", amount: call });
  }
  if (p.stack > toCall) {
    const minBet = Math.max(state.minRaise, 100);
    const raiseTo = state.currentBet + minBet;
    if (p.stack + p.betStreet > state.currentBet) {
      if (p.stack <= toCall + minBet) out.push({ type: "allin", amount: p.stack });
      else {
        const kind: PlayerAction["type"] = state.currentBet === 0 ? "bet" : "raise";
        out.push({ type: kind, amount: Math.min(raiseTo, p.stack + p.betStreet) });
      }
    }
  }
  return out;
}

function pick<T>(xs: T[], pred: (x: T) => boolean, fallback: T): T {
  return xs.find(pred) ?? fallback;
}

export function botAct(state: TableState, p: SeatPlayer): PlayerAction {
  const spec = BOTS.find((b) => p.id === b.id) ?? BOTS[4]!;
  const options = legal(state, p);
  const fold = pick(options, (o) => o.type === "fold", options[0]!);
  const check = options.find((o) => o.type === "check");
  const call = options.find((o) => o.type === "call");
  const agg = options.find((o) => o.type === "bet" || o.type === "raise");
  const allin = options.find((o) => o.type === "allin");
  const toCall = state.currentBet - p.betStreet;
  const pot = state.players.reduce((s, x) => s + x.committed, 0);
  const street: Street = state.street;

  if (!p.hole) return check ?? fold;

  if (street === "preflop") {
    const score = chen(p.hole);
    const threshold = 8 + spec.tightness * 4;
    if (score < threshold - 3 && toCall > 0) return fold;
    if (score < threshold && toCall > 200) return fold;
    if (score >= threshold + 4 && agg && spec.aggression > 0.55) return agg;
    if (score >= threshold) return call ?? check ?? fold;
    return check ?? fold;
  }

  const strength = evalSeven(p.hole, state.board);
  const cat = Math.floor(strength / 16 ** 5);
  const made = cat >= 1;
  const strong = cat >= 3;
  const monster = cat >= 6;

  if (monster) return agg ?? allin ?? call ?? check ?? fold;
  if (strong) {
    if (agg && spec.aggression > 0.5) return agg;
    return call ?? check ?? fold;
  }
  if (made) {
    if (toCall === 0 && agg && spec.aggression > 0.6) return agg;
    if (toCall > 0 && toCall / Math.max(pot, 1) > 0.45 && spec.tightness > 0.78) return fold;
    return call ?? check ?? fold;
  }
  if (toCall === 0) {
    if (agg && spec.aggression > 0.72 && street === "flop") return agg;
    return check ?? fold;
  }
  if (toCall / Math.max(pot, 1) < 0.2 && spec.aggression > 0.65) return call ?? fold;
  return fold;
}
