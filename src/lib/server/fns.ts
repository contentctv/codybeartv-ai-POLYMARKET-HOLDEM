import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { DeskSealedError, GateClosedError } from "@/lib/errors";
import {
  FOLLOW_HANDLE,
  KELLY_CAP,
  KELLY_FRACTION,
  PAPER_BANKROLL,
  TIERS,
} from "@/lib/flags";
import {
  stripeEntrepreneurLink,
  stripePaymentLink,
  xFollowBearer,
} from "@/lib/flags.server";
import { quarterKelly } from "@/lib/kelly";
import { composeStamp } from "@/lib/mba";

export type GateView = {
  signedIn: boolean;
  followStatus: "none" | "attested" | "verified" | "not_following";
  toolsUnlocked: boolean;
  tier: "FREE_TIER" | "PAID_24HR" | "ENTREPRENEUR" | "none";
  credits: number;
  deskUnlocked: boolean;
  mbaUnlocked: boolean;
  deskCollection: "disabled";
  generate: "off";
  liveTrading: false;
  publish: false;
  stripeSuite: boolean;
  stripeMba: boolean;
  sealed: boolean;
};

async function profile(userId: string) {
  const sql = await getSql();
  await sql`insert into profiles (user_id, follow_status) values (${userId}, 'none') on conflict (user_id) do nothing`;
  const rows = await sql<{
    follow_status: string;
  }>`select follow_status from profiles where user_id = ${userId}`;
  return rows[0] ?? { follow_status: "none" };
}

async function activeEntitlement(userId: string) {
  const sql = await getSql();
  const today = new Date().toISOString().slice(0, 10);
  const rows = await sql<{
    id: number;
    tier: string;
    credits_remaining: number;
    credits_daily_reset: string | null;
    daily_spent: number;
    ends_at: string | null;
  }>`
    select id, tier, credits_remaining, credits_daily_reset, daily_spent, ends_at
    from entitlements
    where user_id = ${userId}
      and (ends_at is null or ends_at > now())
    order by case tier
      when 'ENTREPRENEUR' then 0
      when 'PAID_24HR' then 1
      else 2
    end
    limit 1
  `;
  const e = rows[0];
  if (!e) return null;
  if (e.tier === "FREE_TIER" && e.credits_daily_reset !== today) {
    await sql`
      update entitlements
      set credits_remaining = ${TIERS.FREE.creditsPerDay},
          credits_daily_reset = ${today},
          daily_spent = 0
      where id = ${e.id} and user_id = ${userId}
    `;
    e.credits_remaining = TIERS.FREE.creditsPerDay;
    e.daily_spent = 0;
  }
  return e;
}

export const getGate = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<GateView> => {
    try {
      const p = await profile(context.userId);
      const e = await activeEntitlement(context.userId);
      const followStatus = (p.follow_status as GateView["followStatus"]) || "none";
      const followed = followStatus === "attested" || followStatus === "verified";
      const tier = (e?.tier as GateView["tier"]) || (followed ? "FREE_TIER" : "none");
      return {
        signedIn: true,
        followStatus,
        toolsUnlocked: followed,
        tier,
        credits: e?.credits_remaining ?? (followed ? TIERS.FREE.creditsPerDay : 0),
        deskUnlocked: tier === "PAID_24HR" || tier === "ENTREPRENEUR",
        mbaUnlocked: tier === "ENTREPRENEUR",
        deskCollection: "disabled",
        generate: "off",
        liveTrading: false,
        publish: false,
        stripeSuite: Boolean(stripePaymentLink()),
        stripeMba: Boolean(stripeEntrepreneurLink()),
        sealed: false,
      };
    } catch (err) {
      if (err instanceof DeskSealedError) {
        return {
          signedIn: true,
          followStatus: "none",
          toolsUnlocked: false,
          tier: "none",
          credits: 0,
          deskUnlocked: false,
          mbaUnlocked: false,
          deskCollection: "disabled",
          generate: "off",
          liveTrading: false,
          publish: false,
          stripeSuite: Boolean(stripePaymentLink()),
          stripeMba: Boolean(stripeEntrepreneurLink()),
          sealed: true,
        };
      }
      throw err;
    }
  });

export const getPublicRails = createServerFn({ method: "GET" }).handler(async () => {
  return {
    stripeSuite: Boolean(stripePaymentLink()),
    stripeMba: Boolean(stripeEntrepreneurLink()),
    liveTrading: false as const,
    generate: "off" as const,
    publish: false as const,
    deskCollection: "disabled" as const,
  };
});

export const attestFollow = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const bearer = xFollowBearer();
    let status: "attested" | "verified" | "not_following" = "attested";
    if (bearer) {
      try {
        const who = await fetch(
          `https://api.x.com/2/users/by/username/${FOLLOW_HANDLE}`,
          { headers: { Authorization: `Bearer ${bearer}` } },
        );
        if (!who.ok) {
          status = "attested";
        } else {
          status = "attested";
        }
      } catch {
        status = "attested";
      }
    }
    await sql`
      insert into profiles (user_id, handle, follow_status, follow_attested_at)
      values (${context.userId}, ${FOLLOW_HANDLE}, ${status}, now())
      on conflict (user_id) do update set
        follow_status = ${status},
        follow_attested_at = now()
    `;
    if (status === "attested" || status === "verified") {
      const today = new Date().toISOString().slice(0, 10);
      const existing = await sql<{ id: number }>`
        select id from entitlements where user_id = ${context.userId} and tier = 'FREE_TIER' limit 1
      `;
      if (!existing[0]) {
        await sql`
          insert into entitlements (user_id, tier, credits_remaining, credits_daily_reset, source)
          values (${context.userId}, 'FREE_TIER', ${TIERS.FREE.creditsPerDay}, ${today}, 'follow')
        `;
      }
    }
    return { followStatus: status, verified: false as const };
  });

export const enqueueHitl = createServerFn({ method: "POST" })
  .validator((d: { kind: string; rail: string; amountLabel?: string; note?: string }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const kind = data.kind;
    if (!["payment", "post", "withdraw", "refund"].includes(kind)) {
      throw new GateClosedError("HITL kind not allowed");
    }
    const sql = await getSql();
    const rows = await sql<{ id: number }>`
      insert into hitl_queue (user_id, kind, rail, amount_label, payload, status)
      values (
        ${context.userId},
        ${kind},
        ${data.rail},
        ${data.amountLabel ?? null},
        ${JSON.stringify({ note: data.note ?? "", hitl: true })}::jsonb,
        'pending'
      )
      returning id
    `;
    return { id: rows[0]?.id, status: "pending" as const };
  });

export const listHitl = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      kind: string;
      rail: string;
      amount_label: string | null;
      status: string;
      created_at: string;
    }>`
      select id, kind, rail, amount_label, status, created_at
      from hitl_queue
      where user_id = ${context.userId}
      order by id desc
      limit 40
    `;
  });

export const checkoutLink = createServerFn({ method: "POST" })
  .validator((d: { sku: "suite" | "mba" }) => d)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const url = data.sku === "mba" ? stripeEntrepreneurLink() : stripePaymentLink();
    if (!url) {
      return { url: null as string | null, hitl: true as const };
    }
    return { url, hitl: false as const };
  });

export const writeCycle = createServerFn({ method: "POST" })
  .validator((d: { potId: string; p: number; b: number; result: "win" | "lose" | "split" | "fold" }) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const last = await sql<{ bankroll: string }>`
      select bankroll::text from paper_cycles
      where user_id = ${context.userId}
      order by id desc limit 1
    `;
    const bankroll = last[0] ? Number(last[0].bankroll) : PAPER_BANKROLL;
    const ticket = quarterKelly(data.p, data.b, bankroll);
    const next =
      data.result === "win"
        ? bankroll + ticket.sized * data.b
        : data.result === "lose"
          ? bankroll - ticket.sized
          : bankroll;
    await sql`
      insert into paper_cycles (
        user_id, pot_id, market, p, b, kelly_full, kelly_quarter, sized, bankroll, result
      ) values (
        ${context.userId},
        ${data.potId},
        ${"Hero wins pot " + data.potId},
        ${ticket.p},
        ${ticket.b},
        ${ticket.full},
        ${ticket.quarter},
        ${ticket.sized},
        ${next},
        ${data.result}
      )
    `;
    return { ...ticket, bankroll: next, cap: KELLY_CAP, fraction: KELLY_FRACTION };
  });

export const listCycles = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      pot_id: string;
      market: string;
      p: string;
      b: string;
      kelly_quarter: string;
      sized: string;
      bankroll: string;
      result: string | null;
      created_at: string;
    }>`
      select id, pot_id, market, p::text, b::text, kelly_quarter::text, sized::text, bankroll::text, result, created_at
      from paper_cycles
      where user_id = ${context.userId}
      order by id desc
      limit 50
    `;
  });

export const stampMba = createServerFn({ method: "POST" })
  .validator((d: Record<string, string>) => d)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const e = await activeEntitlement(context.userId);
    if (!e || e.tier !== "ENTREPRENEUR") {
      throw new GateClosedError("Entrepreneur MBA is locked");
    }
    if (e.credits_remaining < 1) throw new GateClosedError("No credits");
    const stamp = composeStamp(data);
    await sql`
      update entitlements
      set credits_remaining = credits_remaining - 1
      where id = ${e.id} and user_id = ${context.userId} and credits_remaining >= 1
    `;
    await sql`
      insert into credit_ledger (user_id, delta, reason)
      values (${context.userId}, -1, 'mba-stamp')
    `;
    const rows = await sql<{ id: number }>`
      insert into mba_stamps (
        user_id, territory, offer, gate, radar, thursday_draft, air_gap, published
      ) values (
        ${context.userId},
        ${stamp.territory},
        ${stamp.offer},
        ${stamp.gate},
        ${stamp.radar},
        ${stamp.thursday_draft},
        ${stamp.air_gap},
        false
      )
      returning id
    `;
    return { id: rows[0]?.id, ...stamp, published: false, generate: "off" as const };
  });

export const listStamps = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      territory: string;
      offer: string;
      thursday_draft: string;
      published: boolean;
      created_at: string;
    }>`
      select id, territory, offer, thursday_draft, published, created_at
      from mba_stamps
      where user_id = ${context.userId}
      order by id desc
      limit 20
    `;
  });
