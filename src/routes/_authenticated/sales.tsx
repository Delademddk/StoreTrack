import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, DollarSign, Minus, Plus, Search, Smartphone, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatusBadge, moneyExact } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { categories, products, statusFor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

function SalesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<"Cash" | "Card" | "Mobile Money">("Card");
  const [discount, setDiscount] = useState(0);

  const filtered = products.filter((p) => (cat === "all" || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));

  const add = (id: string) => {
    setCart((c) => {
      const found = c.find((i) => i.id === id);
      if (found) return c.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i));
      const p = products.find((x) => x.id === id)!;
      return [...c, { id, name: p.name, price: p.individualPrice, qty: 1 }];
    });
  };
  const upd = (id: string, delta: number) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const tax = +(subtotal * 0.085).toFixed(2);
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <>
      <PageHeader title="Sales terminal" description="Add products, take payment, and print a receipt." />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Product picker */}
        <div>
          <Card className="rounded-2xl border-border p-3 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-9 rounded-lg border-transparent bg-muted pl-9" />
              </div>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="h-9 w-[170px] rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] disabled:opacity-50"
                disabled={statusFor(p) === "out_of_stock"}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={p.image} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <p className="truncate text-[13px] font-semibold">{p.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{moneyExact(p.individualPrice)}</span>
                    <StatusBadge status={statusFor(p)} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Card className="sticky top-24 flex h-fit flex-col rounded-2xl border-border p-0 shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold">Current sale</h2>
            <span className="text-[11px] text-muted-foreground">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                <p>Tap a product to start a sale</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cart.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{moneyExact(i.price)} each</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-border">
                      <button className="grid size-7 place-items-center hover:bg-muted" onClick={() => upd(i.id, -1)}>
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs">{i.qty}</span>
                      <button className="grid size-7 place-items-center hover:bg-muted" onClick={() => upd(i.id, 1)}>
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <span className="w-16 text-right font-mono text-sm font-semibold">{moneyExact(i.price * i.qty)}</span>
                    <button className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(i.id)}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div className="space-y-2 p-4 text-sm">
            <Row label="Subtotal" value={moneyExact(subtotal)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-7 w-24 text-right font-mono text-xs" />
            </div>
            <Row label="Tax (8.5%)" value={moneyExact(tax)} />
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-mono text-xl font-semibold">{moneyExact(total)}</span>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment method</p>
            <div className="grid grid-cols-3 gap-2">
              {(["Cash", "Card", "Mobile Money"] as const).map((m) => {
                const Icon = m === "Cash" ? DollarSign : m === "Card" ? CreditCard : Smartphone;
                return (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border py-3 text-[11px] font-medium transition-colors",
                      method === m ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                    {m}
                  </button>
                );
              })}
            </div>
            <Button
              className="mt-4 h-11 w-full rounded-xl text-sm font-semibold"
              disabled={cart.length === 0}
              onClick={() => {
                toast.success(`Sale complete — ${moneyExact(total)} via ${method}`);
                setCart([]);
                setDiscount(0);
              }}
            >
              Complete sale
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}