import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { FLYWHEEL } from "@/lib/mba";
import { getGate, listStamps, stampMba, type GateView } from "@/lib/server/fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/mba")({ component: Mba });

function Mba() {
  const { user, isPending } = useCurrentUserState();
  const [gate, setGate] = useState<GateView | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stamps, setStamps] = useState<Awaited<ReturnType<typeof listStamps>>>([]);
  const [out, setOut] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    getGate()
      .then(setGate)
      .catch(() => setGate(null));
    listStamps()
      .then(setStamps)
      .catch(() => setStamps([]));
  }, [user]);

  if (isPending) return <div className="h-32 animate-pulse rounded-xl bg-felt-2" />;
  if (!user) return <RedirectToSignIn />;

  const locked = !gate?.mbaUnlocked;

  return (
    <div className="space-y-6">
      <Badge variant="ember">GENERATE=off · stamp = 1 credit · no auto-post</Badge>
      <h1 className="font-display text-4xl">Entrepreneur MBA Bot</h1>
      <p className="max-w-2xl text-cream/80">
        Territory → Offer → Gate → Radar → Thursday draft → Air gap. Default model grok-4.6. This
        stamp composes locally while GENERATE stays off.
      </p>
      <a className="text-sm text-teal hover:underline" href="/flywheel/mba-bot-prompt-guide.md">
        Prompt guide
      </a>
      {locked ? (
        <p className="text-ember">
          MBA unlocks with the Entrepreneur pass.{" "}
          <Link to="/pass" className="underline">
            Open Pass
          </Link>
        </p>
      ) : null}
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          stampMba({ data: fields })
            .then((s) => {
              setOut(
                [
                  `Territory: ${s.territory}`,
                  `Offer: ${s.offer}`,
                  `Gate: ${s.gate}`,
                  `Radar: ${s.radar}`,
                  `Thursday draft: ${s.thursday_draft}`,
                  `Air gap: ${s.air_gap}`,
                  "Air gap holds. Human publishes.",
                ].join("\n\n"),
              );
              return listStamps();
            })
            .then(setStamps)
            .catch((err: Error) => setOut(err.message));
        }}
      >
        {FLYWHEEL.map((step) => (
          <div key={step.id} className="grid gap-1">
            <Label htmlFor={step.id}>
              {step.title}
            </Label>
            <p className="text-xs text-muted">{step.prompt}</p>
            <Textarea
              id={step.id}
              value={fields[step.id] ?? ""}
              onChange={(e) => setFields({ ...fields, [step.id]: e.target.value })}
            />
          </div>
        ))}
        <Button type="submit" disabled={locked}>
          Stamp (1 credit)
        </Button>
      </form>
      {out ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-felt-2 p-4 text-sm">
          {out}
        </pre>
      ) : null}
      <ul className="space-y-2 text-sm">
        {stamps.map((s) => (
          <li key={s.id} className="rounded-md border border-border px-3 py-2">
            #{s.id} · {s.territory} · published={String(s.published)}
          </li>
        ))}
      </ul>
    </div>
  );
}
