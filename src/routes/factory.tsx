import { createFileRoute, Link } from "@tanstack/react-router";
import { FLOORS, MODELS } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/factory")({ component: Factory });

function Factory() {
  return (
    <div className="space-y-8">
      <header>
        <Badge>Published catalog</Badge>
        <h1 className="mt-3 font-display text-4xl">Factory</h1>
        <p className="mt-2 max-w-2xl text-cream/80">
          Readable without a pass. Floors, models, and the BONES · POEMA lease live here. Tools stay
          locked until you follow @ContentCTV.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        {FLOORS.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>{f.name}</CardTitle>
              <CardDescription>{f.hours}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cream/80">{f.copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section>
        <h2 className="font-display text-2xl">Models</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Rail</th>
                <th className="py-2">Unlocks</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-3 pr-3 font-medium">{m.name}</td>
                  <td className="py-3 pr-3 font-mono text-xs">{m.price}</td>
                  <td className="py-3 pr-3 text-cream/80">{m.rail}</td>
                  <td className="py-3 text-cream/80">{m.unlocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Link to="/lease" className="text-sm text-teal hover:underline">
        Read the BONES · POEMA lease
      </Link>
    </div>
  );
}
