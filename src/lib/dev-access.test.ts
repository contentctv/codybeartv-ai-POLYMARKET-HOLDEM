import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CCA_PREFIX,
  entitlementRank,
  expiryFrom,
  hashCcaToken,
  inspectDevAccess,
  isCcaToken,
  isDevAccessExpired,
  mintCcaToken,
  timingSafeEqualHex,
} from "./dev-access.ts";
import {
  BUY_KIT_HREF,
  DEV_ACCESS_HOURS,
  FOLLOW_HANDLE,
  LIVE_TRADING,
  PAGES_LANDING,
  SUPERCOOL_PRODUCT,
} from "./flags.ts";

test("LIVE_TRADING stays false and Buy kit href is the pasted STRIPE_LINK $47", () => {
  assert.equal(LIVE_TRADING, false);
  assert.equal(BUY_KIT_HREF, "https://buy.stripe.com/eVq6oz9eb5cnaPIeMC9ws00");
  assert.equal(DEV_ACCESS_HOURS, 8);
  assert.equal(FOLLOW_HANDLE, "ContentCTV");
  assert.match(SUPERCOOL_PRODUCT, /2036581b-09df-4e3e-bea0-9bfcdd0d4cba/);
  assert.equal(PAGES_LANDING, "https://contentctv.github.io/codybeartv-ai-POLYMARKET-HOLDEM/");
});

test("mintCcaToken issues an 8-hour cca_ login credential, not a wallet", () => {
  const now = new Date("2026-09-10T17:00:00.000Z");
  const claim = mintCcaToken(now, Buffer.alloc(16, 7));
  assert.equal(claim.kind, "login_credential");
  assert.equal(claim.liveTrading, false);
  assert.equal(claim.wallet, false);
  assert.equal(claim.clob, false);
  assert.equal(claim.hours, 8);
  assert.ok(claim.token.startsWith(CCA_PREFIX));
  assert.equal(isCcaToken(claim.token), true);
  assert.equal(claim.tokenHash, hashCcaToken(claim.token));
  assert.equal(claim.endsAt.toISOString(), expiryFrom(now).toISOString());
  assert.equal(claim.endsAt.getTime() - now.getTime(), 8 * 60 * 60 * 1000);
});

test("inspectDevAccess accepts a matching unexpired hash and rejects the rest", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const claim = mintCcaToken(now, Buffer.from("0123456789abcdef0123456789abcdef", "hex"));
  const ok = inspectDevAccess({
    token: claim.token,
    storedHash: claim.tokenHash,
    endsAt: claim.endsAt,
    revokedAt: null,
    now,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.reason, "ok");
  assert.equal(ok.wallet, false);
  assert.equal(ok.clob, false);
  assert.equal(ok.liveTrading, false);

  assert.equal(
    inspectDevAccess({
      token: "not-a-key",
      storedHash: claim.tokenHash,
      endsAt: claim.endsAt,
      revokedAt: null,
      now,
    }).reason,
    "invalid_shape",
  );
  assert.equal(
    inspectDevAccess({
      token: `${CCA_PREFIX}${"ab".repeat(16)}`,
      storedHash: claim.tokenHash,
      endsAt: claim.endsAt,
      revokedAt: null,
      now,
    }).reason,
    "mismatch",
  );
  assert.equal(
    inspectDevAccess({
      token: claim.token,
      storedHash: claim.tokenHash,
      endsAt: claim.endsAt,
      revokedAt: now,
      now,
    }).reason,
    "revoked",
  );
  const later = new Date(claim.endsAt.getTime() + 1);
  assert.equal(isDevAccessExpired(claim.endsAt, later), true);
  assert.equal(
    inspectDevAccess({
      token: claim.token,
      storedHash: claim.tokenHash,
      endsAt: claim.endsAt,
      revokedAt: null,
      now: later,
    }).reason,
    "expired",
  );
});

test("timingSafeEqualHex and entitlementRank stay exhaustive for known seats", () => {
  assert.equal(timingSafeEqualHex(hashCcaToken("cca_aa"), hashCcaToken("cca_aa")), true);
  assert.equal(timingSafeEqualHex("ab", "cd"), false);
  assert.equal(entitlementRank("ENTREPRENEUR"), 0);
  assert.equal(entitlementRank("PAID_24HR"), 1);
  assert.equal(entitlementRank("DEV_ACCESS_8HR"), 2);
  assert.equal(entitlementRank("FREE_TIER"), 3);
  assert.equal(entitlementRank("none"), 4);
});
