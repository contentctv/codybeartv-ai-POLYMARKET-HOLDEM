export type Floor = {
  id: string;
  name: string;
  hours: string;
  copy: string;
};

export type ModelSku = {
  id: string;
  name: string;
  price: string;
  rail: string;
  unlocks: string;
};

export const FLOORS: Floor[] = [
  {
    id: "felt",
    name: "Night table",
    hours: "Open",
    copy: "Six seats, paper chips, a banker's lamp. Cipher Coast Hold'em lives here. No wallet on the felt.",
  },
  {
    id: "book",
    name: "Paper book",
    hours: "After each pot",
    copy: "Every settled pot writes a hero-wins cycle. Quarter-Kelly, 5% cap. No live CLOB. LIVE_TRADING stays false.",
  },
  {
    id: "lease",
    name: "Lease desk",
    hours: "Readable without a pass",
    copy: "BONES · POEMA education lease. Study copy, not a raise. Human signs. Nothing mints from this floor.",
  },
  {
    id: "mba",
    name: "MBA alcove",
    hours: "Entrepreneur pass",
    copy: "Territory → Offer → Gate → Radar → Thursday draft → Air gap. Stamp costs one credit. Does not auto-post.",
  },
];

export const MODELS: ModelSku[] = [
  {
    id: "suite",
    name: "3-in-1 suite",
    price: "$11.99 or 12 USDC / 24h",
    rail: "Stripe Payment Link when STRIPE_PAYMENT_LINK is set; otherwise HITL.",
    unlocks: "400 credits, desk unlocked (collection still disabled).",
  },
  {
    id: "mba",
    name: "Entrepreneur MBA",
    price: "$49.99 or 50 USDC / 30d",
    rail: "STRIPE_PAYMENT_LINK_ENTREPRENEUR or HITL.",
    unlocks: "2,000 credits, MBA Bot unlocked.",
  },
  {
    id: "sop",
    name: "SOP rosters",
    price: "$19–$47 HITL",
    rail: "Human invoice. No invented checkout URLs.",
    unlocks: "Byproduct chapters after tuition, never a cheap prompt-book SKU.",
  },
  {
    id: "dev-access",
    name: "Developer access",
    price: "Free · 8h after follow",
    rail: "cca_ login credential. HITL. Not a wallet.",
    unlocks: "Paper tools for 8 hours. No CLOB. No LIVE_TRADING. Upsell Supercool + Pages.",
  },
  {
    id: "agency",
    name: "Turnkey agency desk",
    price: "Custom",
    rail: "HITL only. desk_collection=disabled.",
    unlocks: "Operator-scoped desk after human approval.",
  },
];

export const LEASE = {
  title: "BONES · POEMA education lease",
  kicker: "Readable without a pass. Not an offering.",
  body: [
    "BONES is the precision layer: architecture, risk, tests, fail-closed rails. POEMA is the narrative layer: Thursday drafts, merchant news, the air gap between a stamp and a post.",
    "This lease is education. Tuition buys study seats, SOP byproducts, and a paper felt. It does not tokenize a payable, mint a note, or open a live CLOB.",
    "Operator verbs that stay off until GATE_LIFT: GENERATE, PUBLISH (LinkedIn / X), LIVE_TRADING, desk_collection. Human approval sits on every payment, post, withdraw, and refund.",
    "Default model is grok-4.6. Grok 4.7 is discarded until xAI posts an API id. Paper chips on the felt are not money.",
  ],
  clauses: [
    { id: "A", title: "Study seat", text: "Catalog, felt, and paper book are the product. No wallet is wired to the table." },
    { id: "B", title: "Byproduct", text: "SOP chapters unlock from modules. They are not a substitute SKU." },
    { id: "C", title: "Air gap", text: "MBA stamps never auto-post. Thursday is a human publish window." },
    { id: "D", title: "Fail closed", text: "Missing PGLite/Neon, missing webhook secret, missing payment link: the request seals. The process stays up." },
  ],
};
