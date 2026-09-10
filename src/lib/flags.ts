/** Operator gates. LIVE_TRADING stays false until GATE_LIFT LIVE_TRADING. */
export const LIVE_TRADING = false;

/** Imagine / model generate stays off until GATE_LIFT GENERATE. */
export const GENERATE: "off" = "off";

/** Human publishes Thursday. Never auto-post. */
export const PUBLISH_X = false;
export const PUBLISH_LINKEDIN = false;

export const DESK_COLLECTION: "disabled" = "disabled";

/** Default brain. Never invent grok-4.7. */
export const DEFAULT_MODEL = "grok-4.6";

export const FOLLOW_HANDLE = "ContentCTV";
export const FOLLOW_INTENT = "https://x.com/intent/follow?screen_name=ContentCTV";

export const STRIPE_ACCOUNT = "acct_1SgwhY04rVaWG22X";

export const TIERS = {
  FREE: {
    id: "FREE_TIER" as const,
    creditsPerDay: 24,
    label: "Follow pass",
  },
  PAID_24HR: {
    id: "PAID_24HR" as const,
    usd: 11.99,
    usdc: 12,
    hours: 24,
    credits: 400,
    desk: true,
    label: "3-in-1 suite",
  },
  ENTREPRENEUR: {
    id: "ENTREPRENEUR" as const,
    usd: 49.99,
    usdc: 50,
    days: 30,
    credits: 2000,
    mba: true,
    label: "Entrepreneur MBA",
  },
};

export const STARTING_CHIPS = 10_000;
export const SMALL_BLIND = 50;
export const BIG_BLIND = 100;
export const PAPER_BANKROLL = 10_000;
export const KELLY_FRACTION = 0.25;
export const KELLY_CAP = 0.05;

