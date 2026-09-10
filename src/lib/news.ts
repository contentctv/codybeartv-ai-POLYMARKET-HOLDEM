export const ISSUE = {
  number: "01",
  date: "Thursday, 10 Sep 2026",
  byline: "CodyBearTV (@ContentCTV)",
  title: "Grok Bot Merchant News",
  radar: {
    keep: [
      {
        item: "Grok Bot for Enterprise",
        date: "3 Sep 2026",
        why: "xAI opened Grok Bot to enterprises with access, network, and audit controls. Grok and Cursor Enterprise customers received two weeks of free usage, including invites for people without an existing seat. Source: x.ai/news/grok-bot-for-enterprise.",
      },
      {
        item: "Grok Build on Free",
        date: "25 Aug 2026",
        why: "Build Mode, the consumer app-creation layer, is listed on every plan including Free as of 25 Aug 2026. SuperGrok raises limits; it does not unlock the feature. Keep this, discard rumor that Build is still Heavy-only.",
      },
    ],
    discard: [
      {
        item: "Grok 4.7",
        why: "No API id on docs.x.ai. Default remains grok-4.6. Discard until xAI posts an id.",
      },
    ],
  },
  spotlight: {
    title: "Build Spotlight — POLYMARKET HOLD'EM by CODYBEARTV",
    copy: "A night-table 3-in-1: published factory catalog, Cipher Coast Hold'em felt (paper chips), and a paper Polymarket book that writes a hero-wins cycle after each pot. Quarter-Kelly, 5% cap, LIVE_TRADING=false.",
  },
  sop: [
    "Follow @ContentCTV before tools unlock. Intent URL + attestation. Optional X API if X_FOLLOW_BEARER exists. Never fake follower status.",
    "FREE_TIER: 24 credits/day after follow. PAID_24HR: $11.99 or 12 USDC, 24h, 400 credits. ENTREPRENEUR: $49.99 or 50 USDC, 30d, 2,000 credits.",
    "HITL on payment, post, withdraw, refund. Stripe Option 1 is a hosted Payment Link on acct_1SgwhY04rVaWG22X when the env URL exists. Webhooks fail closed without whsec_.",
  ],
  merchant: [
    { sku: "3-in-1 suite", price: "$11.99 / 12 USDC", term: "24h" },
    { sku: "Entrepreneur MBA", price: "$49.99 / 50 USDC", term: "30d" },
    { sku: "SOP rosters", price: "$19–$47", term: "HITL" },
    { sku: "Turnkey agency", price: "Custom desk", term: "HITL" },
  ],
  cta: "Follow @ContentCTV, sit the felt, stamp a Thursday draft. Human publishes. This issue does not auto-post to X or LinkedIn.",
};
