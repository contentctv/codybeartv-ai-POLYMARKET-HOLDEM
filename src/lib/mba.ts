export const FLYWHEEL = [
  {
    id: "territory",
    title: "Territory",
    prompt: "Name the street, platform, or niche you can work this week without a raise.",
  },
  {
    id: "offer",
    title: "Offer",
    prompt: "One education SKU with a price and a byproduct. Not a token. Not a live CLOB.",
  },
  {
    id: "gate",
    title: "Gate",
    prompt: "What stays HITL? Payment, post, withdraw, refund. Write the fail-closed line.",
  },
  {
    id: "radar",
    title: "Radar",
    prompt: "KEEP vs DISCARD from this week's Grok Bot Merchant News. Discard anything without an API id.",
  },
  {
    id: "thursday",
    title: "Thursday draft",
    prompt: "Write the post you will not send. Air gap stays on. Human publishes.",
  },
  {
    id: "airgap",
    title: "Air gap",
    prompt: "List the three verbs that remain off: GENERATE, PUBLISH, LIVE_TRADING.",
  },
] as const;

export function composeStamp(input: Record<string, string>): {
  territory: string;
  offer: string;
  gate: string;
  radar: string;
  thursday_draft: string;
  air_gap: string;
} {
  return {
    territory: input.territory?.trim() || "Unnamed night table.",
    offer: input.offer?.trim() || "Education seat. Paper chips. No wallet.",
    gate: input.gate?.trim() || "HITL on payment, post, withdraw, refund.",
    radar: input.radar?.trim() || "KEEP: Grok Bot for Enterprise (3 Sep 2026), Grok Build on Free (25 Aug). DISCARD: Grok 4.7 until an API id.",
    thursday_draft: input.thursday?.trim() || "Draft only. PUBLISH=off.",
    air_gap: input.airgap?.trim() || "GENERATE=off. PUBLISH=off. LIVE_TRADING=false. desk_collection=disabled.",
  };
}
