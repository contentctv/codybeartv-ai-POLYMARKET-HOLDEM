export type Suit = "s" | "h" | "d" | "c";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type Card = { rank: Rank; suit: Suit };

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "allin";

export type PlayerAction = {
  type: ActionType;
  amount?: number;
};

export type SeatPlayer = {
  id: string;
  name: string;
  portrait: string;
  tagline: string;
  isHero: boolean;
  seat: number;
  stack: number;
  hole: [Card, Card] | null;
  folded: boolean;
  allIn: boolean;
  betStreet: number;
  committed: number;
  sittingOut: boolean;
};

export type Pot = {
  amount: number;
  eligible: string[];
};

export type LogLine = {
  id: string;
  text: string;
};

export type TableState = {
  handId: number;
  button: number;
  street: Street;
  board: Card[];
  deck: Card[];
  players: SeatPlayer[];
  toAct: number | null;
  pending: number[];
  currentBet: number;
  lastFullRaise: number;
  minRaise: number;
  pots: Pot[];
  log: LogLine[];
  winners: { ids: string[]; amount: number; label: string }[];
  heroWins: boolean | null;
  heroCommitted: number;
  potAtShowdown: number;
};

export type BotId = "reed" | "voss" | "marrow" | "finch" | "wren";
