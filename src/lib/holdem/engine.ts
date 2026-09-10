import { BIG_BLIND, SMALL_BLIND, STARTING_CHIPS } from "../flags";
import { botAct, BOTS } from "./bots";
import { draw, freshDeck, shuffle } from "./cards";
import { describeHand, evalSeven } from "./hand";
import { buildPots, livePot } from "./pots";
import type { Card, PlayerAction, SeatPlayer, TableState } from "./types";

let logSeq = 0;
function line(text: string) {
  return { id: `l${++logSeq}`, text };
}

function hero(): SeatPlayer {
  return {
    id: "hero",
    name: "You",
    portrait: "",
    tagline: "Night-table seat",
    isHero: true,
    seat: 0,
    stack: STARTING_CHIPS,
    hole: null,
    folded: false,
    allIn: false,
    betStreet: 0,
    committed: 0,
    sittingOut: false,
  };
}

function botSeat(i: number, seat: number): SeatPlayer {
  const b = BOTS[i]!;
  return {
    id: b.id,
    name: b.name,
    portrait: b.portrait,
    tagline: b.tagline,
    isHero: false,
    seat,
    stack: STARTING_CHIPS,
    hole: null,
    folded: false,
    allIn: false,
    betStreet: 0,
    committed: 0,
    sittingOut: false,
  };
}

export function newTable(): TableState {
  return {
    handId: 0,
    button: 0,
    street: "complete",
    board: [],
    deck: [],
    players: [hero(), botSeat(0, 1), botSeat(1, 2), botSeat(2, 3), botSeat(3, 4), botSeat(4, 5)],
    toAct: null,
    pending: [],
    currentBet: 0,
    lastFullRaise: BIG_BLIND,
    minRaise: BIG_BLIND,
    pots: [],
    log: [line("Paper felt. 10,000 chips. No wallet on this table.")],
    winners: [],
    heroWins: null,
    heroCommitted: 0,
    potAtShowdown: 0,
  };
}

function live(p: SeatPlayer): boolean {
  return !p.folded && !p.sittingOut && (p.stack > 0 || p.committed > 0 || p.allIn);
}

function inHand(p: SeatPlayer): boolean {
  return !p.folded && !p.sittingOut;
}

function nextSeat(state: TableState, from: number, pred: (p: SeatPlayer) => boolean): number | null {
  for (let i = 1; i <= 6; i++) {
    const s = (from + i) % 6;
    const p = state.players.find((x) => x.seat === s);
    if (p && pred(p)) return s;
  }
  return null;
}

function playerAt(state: TableState, seat: number): SeatPlayer | undefined {
  return state.players.find((p) => p.seat === seat);
}

function resetStreet(state: TableState) {
  for (const p of state.players) p.betStreet = 0;
  state.currentBet = 0;
  state.lastFullRaise = BIG_BLIND;
  state.minRaise = BIG_BLIND;
}

function post(state: TableState, seat: number, amount: number, label: string) {
  const p = playerAt(state, seat);
  if (!p) return;
  const a = Math.min(amount, p.stack);
  p.stack -= a;
  p.betStreet += a;
  p.committed += a;
  if (p.stack === 0) p.allIn = true;
  state.log.unshift(line(`${p.name} posts ${label} ${a}.`));
}

export function startHand(prev: TableState): TableState {
  const state: TableState = structuredClone(prev);
  for (const p of state.players) {
    if (p.stack <= 0) {
      p.stack = STARTING_CHIPS;
      state.log.unshift(line(`${p.name} reloads 10,000 paper chips.`));
    }
    p.hole = null;
    p.folded = false;
    p.allIn = false;
    p.betStreet = 0;
    p.committed = 0;
    p.sittingOut = false;
  }
  state.handId += 1;
  state.button = (state.button + 1) % 6;
  state.board = [];
  state.winners = [];
  state.heroWins = null;
  state.heroCommitted = 0;
  state.potAtShowdown = 0;
  state.street = "preflop";
  state.deck = shuffle(freshDeck());
  const sb = nextSeat(state, state.button, live) ?? 0;
  const bb = nextSeat(state, sb, live) ?? 0;
  post(state, sb, SMALL_BLIND, "SB");
  post(state, bb, BIG_BLIND, "BB");
  state.currentBet = BIG_BLIND;
  state.minRaise = BIG_BLIND;
  for (let i = 0; i < 2; i++) {
    for (let s = 0; s < 6; s++) {
      const seat = (state.button + 1 + s) % 6;
      const p = playerAt(state, seat);
      if (!p || p.folded) continue;
      const c = draw(state.deck);
      if (!p.hole) p.hole = [c, c];
      else p.hole[i] = c;
    }
  }
  openRound(state, bb);
  state.log.unshift(line(`Hand #${state.handId}. Button seat ${state.button}.`));
  return state;
}

function dealBoard(state: TableState, n: number) {
  draw(state.deck);
  for (let i = 0; i < n; i++) state.board.push(draw(state.deck));
}

function actingSeats(state: TableState): number[] {
  return state.players
    .filter((p) => inHand(p) && !p.allIn && p.stack > 0)
    .map((p) => p.seat);
}

function queueFrom(state: TableState, start: number): number[] {
  const seats = actingSeats(state);
  const ordered: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const s = (start + i) % 6;
    if (seats.includes(s)) ordered.push(s);
  }
  return ordered;
}

function openRound(state: TableState, start: number) {
  state.pending = queueFrom(state, start);
  state.toAct = state.pending[0] ?? null;
}

function firstToActPost(state: TableState): number | null {
  return nextSeat(state, state.button, (p) => inHand(p) && !p.allIn && p.stack > 0);
}

function advanceStreet(state: TableState) {
  const alive = state.players.filter(inHand);
  if (alive.length <= 1) {
    settle(state);
    return;
  }
  resetStreet(state);
  if (state.street === "preflop") {
    state.street = "flop";
    dealBoard(state, 3);
    state.log.unshift(line("Flop."));
  } else if (state.street === "flop") {
    state.street = "turn";
    dealBoard(state, 1);
    state.log.unshift(line("Turn."));
  } else if (state.street === "turn") {
    state.street = "river";
    dealBoard(state, 1);
    state.log.unshift(line("River."));
  } else {
    settle(state);
    return;
  }
  const start = firstToActPost(state);
  if (start === null) {
    if (state.street === "river") settle(state);
    else advanceStreet(state);
    return;
  }
  openRound(state, (start + 5) % 6);
}

function settle(state: TableState) {
  state.street = "showdown";
  state.toAct = null;
  state.pots = buildPots(state.players);
  state.potAtShowdown = livePot(state.players);
  const heroP = state.players.find((p) => p.isHero)!;
  state.heroCommitted = heroP.committed;
  const winners: TableState["winners"] = [];
  let heroWon = false;
  for (const pot of state.pots) {
    const elig = state.players.filter((p) => pot.eligible.includes(p.id) && inHand(p) && p.hole);
    if (elig.length === 0) continue;
    const scored = elig.map((p) => ({
      p,
      s: evalSeven(p.hole as [Card, Card], state.board),
    }));
    const best = Math.max(...scored.map((x) => x.s));
    const win = scored.filter((x) => x.s === best);
    const share = Math.floor(pot.amount / win.length);
    const label = win.map((w) => describeHand(w.p.hole as [Card, Card], state.board)).join(" / ");
    for (const w of win) {
      w.p.stack += share;
      if (w.p.isHero) heroWon = true;
    }
    winners.push({ ids: win.map((w) => w.p.id), amount: pot.amount, label });
    state.log.unshift(
      line(
        `${win.map((w) => w.p.name).join(" & ")} take ${pot.amount} with ${label}.`,
      ),
    );
  }
  const leftover = livePot(state.players) - state.pots.reduce((s, p) => s + p.amount, 0);
  if (leftover > 0 && heroP) heroP.stack += leftover;
  state.winners = winners;
  state.heroWins = inHand(heroP) ? heroWon : false;
  state.street = "complete";
}

export function applyAction(prev: TableState, action: PlayerAction): TableState {
  const state: TableState = structuredClone(prev);
  if (state.toAct === null || state.street === "complete") return state;
  const p = playerAt(state, state.toAct);
  if (!p) return state;
  const toCall = state.currentBet - p.betStreet;
  let reopened = false;

  if (action.type === "fold") {
    p.folded = true;
    state.log.unshift(line(`${p.name} folds.`));
  } else if (action.type === "check") {
    state.log.unshift(line(`${p.name} checks.`));
  } else if (action.type === "call") {
    const a = Math.min(toCall, p.stack);
    p.stack -= a;
    p.betStreet += a;
    p.committed += a;
    if (p.stack === 0) p.allIn = true;
    state.log.unshift(line(`${p.name} calls ${a}.`));
  } else if (action.type === "bet" || action.type === "raise" || action.type === "allin") {
    let target =
      action.type === "allin" ? p.betStreet + p.stack : (action.amount ?? state.currentBet + state.minRaise);
    target = Math.min(target, p.betStreet + p.stack);
    const put = target - p.betStreet;
    if (put <= 0) {
      state.log.unshift(line(`${p.name} checks.`));
    } else {
      const raiseBy = target - state.currentBet;
      p.stack -= put;
      p.betStreet += put;
      p.committed += put;
      if (p.stack === 0) p.allIn = true;
      if (target > state.currentBet) {
        if (raiseBy >= state.minRaise) {
          state.minRaise = raiseBy;
          state.lastFullRaise = raiseBy;
          reopened = true;
        } else if (raiseBy > 0 && !p.allIn) {
          reopened = true;
        } else if (raiseBy >= state.minRaise * 0.99) {
          reopened = true;
        } else if (raiseBy > 0) {
          reopened = p.stack === 0 ? false : true;
        }
        state.currentBet = target;
        if (p.allIn && raiseBy < state.minRaise && raiseBy > 0) {
          reopened = false;
        }
        if (p.allIn && raiseBy >= state.minRaise) reopened = true;
        if (!p.allIn && raiseBy > 0) reopened = true;
        state.log.unshift(
          line(`${p.name} ${action.type === "bet" ? "bets" : p.allIn ? "is all-in" : "raises to"} ${target}.`),
        );
      } else {
        state.log.unshift(line(`${p.name} calls ${put}.`));
      }
    }
  }

  const alive = state.players.filter(inHand);
  if (alive.length <= 1) {
    settle(state);
    return state;
  }

  if (reopened) {
    state.pending = queueFrom(state, p.seat);
  } else {
    state.pending = state.pending.filter((s) => s !== p.seat);
    state.pending = state.pending.filter((s) => {
      const x = playerAt(state, s);
      return x && inHand(x) && !x.allIn && x.stack > 0;
    });
  }

  if (state.pending.length === 0) {
    advanceStreet(state);
    return state;
  }
  state.toAct = state.pending[0] ?? null;
  if (state.toAct === null) advanceStreet(state);
  return state;
}

export function legalActions(state: TableState): PlayerAction[] {
  if (state.toAct === null) return [];
  const p = playerAt(state, state.toAct);
  if (!p || !p.isHero) return [];
  const toCall = state.currentBet - p.betStreet;
  const acts: PlayerAction[] = [{ type: "fold" }];
  if (toCall <= 0) acts.push({ type: "check" });
  else {
    const call = Math.min(toCall, p.stack);
    acts.push(call >= p.stack ? { type: "allin", amount: p.stack } : { type: "call", amount: call });
  }
  if (p.stack > Math.max(toCall, 0)) {
    const minTo = state.currentBet === 0 ? BIG_BLIND : state.currentBet + state.minRaise;
    const maxTo = p.stack + p.betStreet;
    if (maxTo > state.currentBet) {
      if (minTo >= maxTo) acts.push({ type: "allin", amount: p.stack });
      else {
        acts.push({
          type: state.currentBet === 0 ? "bet" : "raise",
          amount: Math.min(minTo, maxTo),
        });
        if (maxTo > minTo) acts.push({ type: "allin", amount: p.stack });
      }
    }
  }
  return acts;
}

export function runBots(state: TableState): TableState {
  let s = state;
  let guard = 0;
  while (s.toAct !== null && s.street !== "complete" && guard < 80) {
    const p = playerAt(s, s.toAct);
    if (!p) break;
    if (p.isHero) break;
    const act = botAct(s, p);
    s = applyAction(s, act);
    guard += 1;
  }
  return s;
}

export function minRaiseTo(state: TableState): number {
  const p = state.players.find((x) => x.seat === state.toAct);
  if (!p) return 0;
  const minTo = state.currentBet === 0 ? BIG_BLIND : state.currentBet + state.minRaise;
  return Math.min(minTo, p.stack + p.betStreet);
}

export function maxRaiseTo(state: TableState): number {
  const p = state.players.find((x) => x.seat === state.toAct);
  if (!p) return 0;
  return p.stack + p.betStreet;
}
