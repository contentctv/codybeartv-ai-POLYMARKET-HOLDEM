import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FOLLOW_HANDLE, FOLLOW_INTENT, SUPERCOOL_PRODUCT, PAGES_LANDING, BUY_KIT_HREF, TIERS } from "@/lib/flags";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { attestFollow, checkoutLink, enqueueHitl, getGate, getPublicRails, type GateView } from "@/lib/server/fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/pass")({ component: Pass });

function Pass() {
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<GateView | null>(null);
  const [rails, setRails] = useState<{ stripeSuite: boolean; stripeMba: boolean } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getPublicRails().then(setRails).catch(() => setRails(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    getGate()
      .then(setGate)
      .catch(() => setGate(null));
  }, [user]);

  function pay(sku: "suite" | "mba") {
    if (!user) return;
    checkoutLink({ data: { sku } })
      .then((r) => {
        if (r.url) {
          window.location.href = r.url;
          return;
        }
        return enqueueHitl({
          data: {
            kind: "payment",
            rail: "stripe_payment_link",
            amountLabel: sku === "mba" ? "$49.99 / 50 USDC" : "$11.99 / 12 USDC",
            note: "Payment Link env missing — HITL",
          },
        }).then((q) => setMsg(`HITL queued #${q.id}. No invented checkout URL.`));
      })
      .catch((err: Error) => setMsg(err.message));
  }

  return (
    <div className="space-y-8">
      <header>
        <Badge>HITL on every payment</Badge>
        <h1 className="mt-3 font-display text-4xl">Pass</h1>
        <p className="mt-2 max-w-2xl text-cream/80">
          Follow @{FOLLOW_HANDLE}, then pick a seat. Stripe Option 1 is a hosted Payment Link on
          acct_1SgwhY04rVaWG22X when the env URL is present. Otherwise the desk queues a human.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Follow</CardTitle>
          <CardDescription>
            Intent URL + attestation. Optional X API if a bearer exists. Never faked.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="teal">
            <a href={FOLLOW_INTENT} target="_blank" rel="noreferrer">
              Follow @{FOLLOW_HANDLE}
            </a>
          </Button>
          {user ? (
            <Button
              variant="outline"
              onClick={() =>
                attestFollow()
                  .then((r) => {
                    setMsg(
                      r.verified
                        ? "Follow verified via X API."
                        : "Attestation stored. Not marked verified without X API confirmation.",
                    );
                    return getGate();
                  })
                  .then(setGate)
                  .catch((err: Error) => setMsg(err.message))
              }
            >
              I followed @{FOLLOW_HANDLE}
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/login">Sign in with X first</Link>
            </Button>
          )}
          {gate ? (
            <span className="self-center text-xs text-muted">status: {gate.followStatus}</span>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{TIERS.PAID_24HR.label}</CardTitle>
            <CardDescription>
              ${TIERS.PAID_24HR.usd} or {TIERS.PAID_24HR.usdc} USDC · 24h · {TIERS.PAID_24HR.credits}{" "}
              credits · desk unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled={!user} onClick={() => pay("suite")}>
              {rails?.stripeSuite ? "Pay via Stripe Payment Link" : "Queue HITL payment"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{TIERS.ENTREPRENEUR.label}</CardTitle>
            <CardDescription>
              ${TIERS.ENTREPRENEUR.usd} or {TIERS.ENTREPRENEUR.usdc} USDC · 30d ·{" "}
              {TIERS.ENTREPRENEUR.credits} credits · MBA unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled={!user} variant="teal" onClick={() => pay("mba")}>
              {rails?.stripeMba ? "Pay via Stripe Payment Link" : "Queue HITL payment"}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{TIERS.DEV_ACCESS.label}</CardTitle>
          <CardDescription>
            Free {TIERS.DEV_ACCESS.hours}h <code>cca_</code> login key after follow. Not a wallet.
            Not CLOB. LIVE_TRADING=false.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/dev-access">Claim 8-hour developer access</Link>
          </Button>
        </CardContent>
      </Card>
      <p className="text-sm text-muted">
        FREE_TIER: {TIERS.FREE.creditsPerDay} credits/day after follow. {TIERS.DEV_ACCESS.label}:{" "}
        {TIERS.DEV_ACCESS.hours}h <code>cca_</code> login key —{" "}
        <Link to="/dev-access">claim on Developer access</Link>. Rails B/C (X Money, PayPal, Cash
        App, Bitcoin Jungle Lightning, SINPE Móvil CBTV-######, USDC receipt, EIP-1193, HTTP 402)
        stay on the desk as HITL. Kit upsell:{" "}
        <a className="text-teal underline-offset-4 hover:underline" href={SUPERCOOL_PRODUCT}>
          Supercool $47
        </a>
        {" · "}
        <a className="text-teal underline-offset-4 hover:underline" href={PAGES_LANDING}>
          Pages
        </a>
        . Buy kit stays <code>{BUY_KIT_HREF}</code>.
      </p>
      {msg ? <p className="text-sm text-teal">{msg}</p> : null}
      {isPending ? <p className="text-xs text-muted">Checking session…</p> : null}
    </div>
  );
}
