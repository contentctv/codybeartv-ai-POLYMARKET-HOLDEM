export function isGenerateOn(): boolean {
  return process.env.GATE_LIFT === "GENERATE";
}

/**
 * Env-gated Stripe Payment Link for in-app checkout.
 * When set, STRIPE_PAYMENT_LINK must match BUY_KIT_HREF
 * (https://buy.stripe.com/eVq6oz9eb5cnaPIeMC9ws00). Do not invent a second URL.
 * Unset keeps HITL. This is not STRIPE_LIVE and does not lift LIVE_TRADING.
 */
export function stripePaymentLink(): string | null {
  const url = process.env.STRIPE_PAYMENT_LINK?.trim();
  return url && url.startsWith("https://") ? url : null;
}

export function stripeEntrepreneurLink(): string | null {
  const url = process.env.STRIPE_PAYMENT_LINK_ENTREPRENEUR?.trim();
  return url && url.startsWith("https://") ? url : null;
}

export function stripeWebhookSecret(): string | null {
  const s = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return s && s.startsWith("whsec_") ? s : null;
}

export function stripeRestrictedKey(): string | null {
  const s = process.env.STRIPE_RESTRICTED_KEY?.trim();
  return s && (s.startsWith("rk_live_") || s.startsWith("rk_test_")) ? s : null;
}

export function xFollowBearer(): string | null {
  const s = process.env.X_FOLLOW_BEARER?.trim();
  return s ? s : null;
}
