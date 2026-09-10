import type { Pot, SeatPlayer } from "./types";

export function buildPots(players: SeatPlayer[]): Pot[] {
  const pots: Pot[] = [];
  const work = players
    .filter((p) => p.committed > 0)
    .map((p) => ({ id: p.id, committed: p.committed, folded: p.folded }));
  while (work.length > 0) {
    const level = Math.min(...work.map((w) => w.committed));
    const amount = level * work.length;
    const eligible = work.filter((w) => !w.folded).map((w) => w.id);
    if (amount > 0) pots.push({ amount, eligible });
    for (const w of work) w.committed -= level;
    for (let i = work.length - 1; i >= 0; i--) {
      if (work[i]!.committed <= 0) work.splice(i, 1);
    }
  }
  return pots;
}

export function potTotal(pots: Pot[]): number {
  return pots.reduce((s, p) => s + p.amount, 0) ;
}

export function livePot(players: SeatPlayer[]): number {
  return players.reduce((s, p) => s + p.committed, 0);
}
