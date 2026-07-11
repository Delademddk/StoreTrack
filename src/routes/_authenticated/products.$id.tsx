import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Boxes, Building2, Package, Pencil, Tag, TrendingUp } from "lucide-react";

import { PageHeader, StatusBadge, moneyExact } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auditLog, products, sales, statusFor, totalQty } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/products/$id")({
  loader: ({ params }) => {
    const product = products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product };
  },
  component: ProductDetailPage,
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <p className="text-sm text-muted-foreground">Product not found.</p>
      <Link to="/products" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">← Back to products</Link>
    </div>
  ),
});

function ProductDetailPage() {
  const { product: p } = Route.useLoaderData();
  const productSales = sales.filter((s) => s.items.some((i) => i.productId === p.id));
  const productAudit = auditLog.filter((l) => l.target.includes(p.sku));

  return (
    <>
      <PageHeader
        title={p.name}
        description={`${p.category} · ${p.brand} · ${p.sku}`}
        actions={
          <>
            <Link to="/products"><Button variant="outline" className="gap-2 rounded-xl"><ArrowLeft className="size-4" /> Back</Button></Link>
            <Link to="/products/$id/edit" params={{ id: p.id }}>
              <Button className="gap-2 rounded-xl"><Pencil className="size-4" /> Edit</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
            <div className="grid gap-6 p-6 md:grid-cols-[240px_1fr]">
              <img src={p.image} alt={p.name} className="aspect-square w-full rounded-xl object-cover ring-1 ring-border" />
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={statusFor(p)} />
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{p.sku}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <Stat icon={Boxes} label="Boxes" value={`${p.boxes}`} sub={`× ${p.itemsPerBox} items`} />
                  <Stat icon={Package} label="Extra pieces" value={`${p.extraPieces}`} sub={`Total ${totalQty(p)} units`} />
                  <Stat icon={Tag} label="Unit price" value={moneyExact(p.individualPrice)} sub={`Box ${moneyExact(p.pricePerBox)}`} />
                  <Stat icon={Building2} label="Supplier" value={p.supplier} sub={`Threshold ${p.lowStockThreshold}`} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-sm font-semibold">Sales history</h2>
                <p className="text-xs text-muted-foreground">Every transaction involving this SKU</p>
              </div>
              <TrendingUp className="size-4 text-brand" />
            </div>
            {productSales.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Invoice</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productSales.map((s) => {
                    const item = s.items.find((i) => i.productId === p.id)!;
                    return (
                      <tr key={s.id}>
                        <td className="px-5 py-3 font-mono text-brand">{s.invoice}</td>
                        <td className="px-5 py-3">{s.customer}</td>
                        <td className="px-5 py-3 text-right font-mono">{item.qty}</td>
                        <td className="px-5 py-3 text-right font-mono">{moneyExact(item.qty * item.unitPrice)}</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{new Date(s.at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Timeline */}
        <Card className="rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
          <div className="border-b border-border p-5">
            <h2 className="text-sm font-semibold">Inventory timeline</h2>
            <p className="text-xs text-muted-foreground">Full traceability</p>
          </div>
          <ol className="relative m-5 border-l border-border pl-6">
            {(productAudit.length ? productAudit : auditLog.slice(0, 4)).map((a) => (
              <li key={a.id} className="mb-6 last:mb-0">
                <span className="absolute -left-1.5 grid size-3 place-items-center rounded-full bg-brand ring-4 ring-background" />
                <p className="text-sm font-semibold">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{a.at} · {a.user}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Boxes; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <p className="mt-1 font-semibold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}