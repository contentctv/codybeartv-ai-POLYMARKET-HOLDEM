import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BUY_KIT_HREF,
  DEV_ACCESS_HOURS,
  FOLLOW_HANDLE,
  FOLLOW_INTENT,
  PAGES_LANDING,
  SUPERCOOL_PRODUCT,
  TIERS,
} from "@/lib/flags";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  attestFollow,
  claimDevAccess,
  getGate,
  inspectDevAccessKey,
  presentDevAccess,
  type GateView,
} from "@/lib/server/fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dev-access")({ component: DevAccess });

function DevAccess() {
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<GateView | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    getGate()
      .then(setGate)
      .catch(() => setGate(null));
  }, [user]);

  const followed = gate?.followStatus === "attested" || gate?.followStatus === "verified";

  return (
    <div className="space-y-8">
      <header>
        <Badge>Paper login · {DEV_ACCESS_HOURS}h</Badge>
        <h1 className="mt-3 font-display text-4xl">Developer access</h1>
        <p className="mt-2 max-w-2xl text-cream/80">
          Follow @{FOLLOW_HANDLE}, attest, then claim an 8-hour <code>cca_</code> login credential.
          Not a wallet. Not live trading. Not CLOB margin. LIVE_TRADING stays false.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Follow @{FOLLOW_HANDLE}</CardTitle>
          <CardDescription>Intent URL + attestation. Same FREE_TIER follow pass. Never faked.</CardDescription>
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
                        : "Attestation stored. Claim the 8-hour key next.",
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

      <Card>
        <CardHeader>
          <CardTitle>2. Claim {TIERS.DEV_ACCESS.label}</CardTitle>
          <CardDescription>
            {DEV_ACCESS_HOURS}-hour <code>cca_</code> key. Shown once. Hash at rest. HITL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            disabled={!user || !followed}
            onClick={() =>
              claimDevAccess()
                .then((r) => {
                  setToken(r.token);
                  setMsg(
                    r.alreadyIssued
                      ? `Key already issued. Expires ${r.expiresAt}. Copy was shown once.`
                      : `Key issued. Expires ${r.expiresAt}. Copy it now.`,
                  );
                  return getGate();
                })
                .then(setGate)
                .catch((err: Error) => setMsg(err.message))
            }
          >
            Claim 8-hour cca_ key
          </Button>
          {token ? (
            <p className="break-all font-mono text-sm text-teal">
              {token}
              <span className="mt-1 block text-xs text-muted">Shown once. Not a wallet.</span>
            </p>
          ) : null}
          {gate?.devAccess.active ? (
            <p className="text-xs text-muted">Active until {gate.devAccess.expiresAt}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Present key</CardTitle>
          <CardDescription>
            Verify shape + expiry. Signed-in present re-attaches the follow pass. Does not enable spending.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="cca_…"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!paste.trim()}
              onClick={() =>
                inspectDevAccessKey({ data: { token: paste } })
                  .then((r) =>
                    setMsg(
                      r.ok
                        ? `Valid login credential until ${r.expiresAt}. LIVE_TRADING=false.`
                        : `Key ${r.reason}. Buy the kit or wait to re-claim.`,
                    ),
                  )
                  .catch((err: Error) => setMsg(err.message))
              }
            >
              Verify key
            </Button>
            <Button
              variant="outline"
              disabled={!user || !paste.trim()}
              onClick={() =>
                presentDevAccess({ data: { token: paste } })
                  .then((r) => {
                    setMsg(`Presented. Tools follow the existing gate until ${r.expiresAt}.`);
                    return getGate();
                  })
                  .then(setGate)
                  .catch((err: Error) => setMsg(err.message))
              }
            >
              Present on this session
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>After 8 hours</CardTitle>
          <CardDescription>Sales point to Supercool and Pages. Stripe Buy kit stays dead.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="teal">
            <a href={SUPERCOOL_PRODUCT} target="_blank" rel="noreferrer">
              Supercool kit $47
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={PAGES_LANDING} target="_blank" rel="noreferrer">
              Pages paywall
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={BUY_KIT_HREF} id="buy-kit" data-stripe="OPERATOR_FILL">
              Buy kit $47
            </a>
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted">
        Operator card: <Link to="/pass">Pass</Link>. Docs: docs/DEV_ACCESS.md. Discord HOLD.
      </p>
      {msg ? <p className="text-sm text-teal">{msg}</p> : null}
      {isPending ? <p className="text-xs text-muted">Checking session…</p> : null}
    </div>
  );
}
