import { createFileRoute, Link } from "@tanstack/react-router";
import { ISSUE } from "@/lib/news";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/flywheel")({ component: Flywheel });

function Flywheel() {
  return (
    <article className="space-y-8">
      <div>
        <Badge variant="teal">Weekly Thursday · PUBLISH=off</Badge>
        <h1 className="mt-3 font-display text-4xl">{ISSUE.title}</h1>
        <p className="mt-1 text-sm text-muted">
          Issue {ISSUE.number} · {ISSUE.date} · {ISSUE.byline}
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Radar · KEEP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-cream/80">
            {ISSUE.radar.keep.map((k) => (
              <p key={k.item}>
                <strong className="text-cream">{k.item}</strong> ({k.date}) — {k.why}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Radar · DISCARD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-cream/80">
            {ISSUE.radar.discard.map((k) => (
              <p key={k.item}>
                <strong className="text-ember">{k.item}</strong> — {k.why}
              </p>
            ))}
          </CardContent>
        </Card>
      </section>
      <section>
        <h2 className="font-display text-2xl">{ISSUE.spotlight.title}</h2>
        <p className="mt-2 max-w-2xl text-cream/80">{ISSUE.spotlight.copy}</p>
      </section>
      <section>
        <h2 className="font-display text-2xl">SOP</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-cream/80">
          {ISSUE.sop.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="font-display text-2xl">Merchant Corner</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[24rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2">Term</th>
              </tr>
            </thead>
            <tbody>
              {ISSUE.merchant.map((m) => (
                <tr key={m.sku} className="border-t border-border">
                  <td className="py-2 pr-3">{m.sku}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{m.price}</td>
                  <td className="py-2">{m.term}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-cream/80">{ISSUE.cta}</p>
      <Link to="/mba" className="text-sm text-teal hover:underline">
        Open the MBA alcove
      </Link>
    </article>
  );
}
