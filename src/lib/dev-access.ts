import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  BUY_KIT_HREF,
  DEV_ACCESS_HOURS,
  FOLLOW_HANDLE,
  FOLLOW_INTENT,
  LIVE_TRADING,
  PAGES_LANDING,
  SUPERCOOL_PRODUCT,
} from "./flags.ts";

export const CCA_PREFIX = "cca_";
export const CCA_BODY_HEX_LENGTH = 32;

export type DevAccessKind = "login_credential";
export type DevAccessReason = "invalid_shape" | "mismatch" | "expired" | "revoked" | "ok";

export type DevAccessClaim = {
  token: string;
  tokenHash: string;
  hours: number;
  startsAt: Date;
  endsAt: Date;
  kind: DevAccessKind;
  liveTrading: false;
  wallet: false;
  clob: false;
};

export type DevAccessInspect = {
  ok: boolean;
  reason: DevAccessReason;
  kind: DevAccessKind;
  expiresAt: string | null;
  liveTrading: false;
  wallet: false;
  clob: false;
};

export type DevAccessUpsell = {
  supercool: typeof SUPERCOOL_PRODUCT;
  pages: typeof PAGES_LANDING;
  buyKitHref: typeof BUY_KIT_HREF;
  followHandle: typeof FOLLOW_HANDLE;
  followIntent: typeof FOLLOW_INTENT;
};

const PAPER: Pick<DevAccessInspect, "kind" | "liveTrading" | "wallet" | "clob"> = {
  kind: "login_credential",
  liveTrading: false,
  wallet: false,
  clob: false,
};

/** Widen the const so GATE_LIFT LIVE_TRADING would fail closed at runtime. */
export function assertPaperDevAccess(): void {
  const live: boolean = LIVE_TRADING;
  if (live) {
    throw new Error("DEV ACCESS is paper-only. LIVE_TRADING must stay false.");
  }
}

export function isCcaToken(token: string): boolean {
  return new RegExp(`^${CCA_PREFIX}[a-f0-9]{${CCA_BODY_HEX_LENGTH}}$`).test(token.trim());
}

export function hashCcaToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function expiryFrom(now: Date, hours = DEV_ACCESS_HOURS): Date {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export function isDevAccessExpired(endsAt: Date, now = new Date()): boolean {
  return now.getTime() >= endsAt.getTime();
}

export function mintCcaToken(now = new Date(), bytes = randomBytes(16)): DevAccessClaim {
  assertPaperDevAccess();
  const token = `${CCA_PREFIX}${bytes.toString("hex")}`;
  return {
    token,
    tokenHash: hashCcaToken(token),
    hours: DEV_ACCESS_HOURS,
    startsAt: now,
    endsAt: expiryFrom(now),
    kind: "login_credential",
    liveTrading: false,
    wallet: false,
    clob: false,
  };
}

export function inspectDevAccess(input: {
  token: string;
  storedHash: string | null;
  endsAt: Date | null;
  revokedAt: Date | null;
  now?: Date;
}): DevAccessInspect {
  assertPaperDevAccess();
  const now = input.now ?? new Date();
  if (!isCcaToken(input.token)) {
    return { ...PAPER, ok: false, reason: "invalid_shape", expiresAt: null };
  }
  if (!input.storedHash || !timingSafeEqualHex(hashCcaToken(input.token), input.storedHash)) {
    return { ...PAPER, ok: false, reason: "mismatch", expiresAt: null };
  }
  const expiresAt = input.endsAt ? input.endsAt.toISOString() : null;
  if (input.revokedAt) {
    return { ...PAPER, ok: false, reason: "revoked", expiresAt };
  }
  if (!input.endsAt || isDevAccessExpired(input.endsAt, now)) {
    return { ...PAPER, ok: false, reason: "expired", expiresAt };
  }
  return { ...PAPER, ok: true, reason: "ok", expiresAt };
}

export function devAccessUpsell(): DevAccessUpsell {
  return {
    supercool: SUPERCOOL_PRODUCT,
    pages: PAGES_LANDING,
    buyKitHref: BUY_KIT_HREF,
    followHandle: FOLLOW_HANDLE,
    followIntent: FOLLOW_INTENT,
  };
}

export type EntitlementTier = "ENTREPRENEUR" | "PAID_24HR" | "DEV_ACCESS_8HR" | "FREE_TIER" | "none";

/** Paid seats beat the 8hr login key; the key beats a daily follow pass. */
export function entitlementRank(tier: EntitlementTier): number {
  switch (tier) {
    case "ENTREPRENEUR":
      return 0;
    case "PAID_24HR":
      return 1;
    case "DEV_ACCESS_8HR":
      return 2;
    case "FREE_TIER":
      return 3;
    case "none":
      return 4;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
