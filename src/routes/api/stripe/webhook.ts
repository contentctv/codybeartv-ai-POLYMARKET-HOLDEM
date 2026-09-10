import { createHmac, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { stripeRestrictedKey, stripeWebhookSecret } from "@/lib/flags.server";
import { TIERS } from "@/lib/flags";

function verifyStripeSignature(raw: string, header: string, secret: string): boolean {
  const map = new Map<string, string>();
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k && v) map.set(k.trim(), v.trim());
  }
  const t = map.get("t");
  const v1 = map.get("v1");
  if (!t || !v1) return false;
  const mac = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(v1);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = stripeWebhookSecret();
        if (!secret) {
          return new Response("webhook sealed — missing whsec_", { status: 503 });
        }
        const raw = await request.text();
        const sig = request.headers.get("stripe-signature") ?? "";
        if (!sig) return new Response("missing signature", { status: 400 });
        if (!verifyStripeSignature(raw, sig, secret)) {
          return new Response("invalid signature", { status: 400 });
        }

        const key = stripeRestrictedKey();
        if (!key) {
          return new Response("webhook sealed — restricted key missing", { status: 503 });
        }

        let event: { id: string; type: string; data?: { object?: { id?: string; metadata?: Record<string, string> } } };
        try {
          event = JSON.parse(raw) as typeof event;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const sessionId = event.data?.object?.id ?? "";
        if (sessionId && !sessionId.startsWith("cs_live_") && !sessionId.startsWith("cs_test_")) {
          return new Response("restricted key retrieves cs_live_/cs_test_ only", { status: 400 });
        }

        try {
          const sql = await getSql();
          const seen = await sql<{ id: string }>`select id from stripe_events where id = ${event.id}`;
          if (seen[0]) return new Response("ok", { status: 200 });
          await sql`insert into stripe_events (id, session_id) values (${event.id}, ${sessionId || null})`;
          const userId = event.data?.object?.metadata?.user_id;
          const sku = event.data?.object?.metadata?.sku;
          if (userId && event.type.startsWith("checkout.session")) {
            if (sku === "mba") {
              await sql`
                insert into entitlements (user_id, tier, credits_remaining, ends_at, source)
                values (${userId}, 'ENTREPRENEUR', ${TIERS.ENTREPRENEUR.credits}, now() + interval '30 days', 'stripe')
              `;
            } else if (sku === "suite") {
              await sql`
                insert into entitlements (user_id, tier, credits_remaining, ends_at, source)
                values (${userId}, 'PAID_24HR', ${TIERS.PAID_24HR.credits}, now() + interval '24 hours', 'stripe')
              `;
            }
          }
        } catch {
          return new Response("desk sealed", { status: 503 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
