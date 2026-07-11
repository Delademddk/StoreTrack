import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  Filter,
  LayoutGrid,
  List,
  Package,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader, StatusBadge, moneyExact } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, products, statusFor, totalQty } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      const s = statusFor(p);
      if (status !== "all" && s !== status) return false;
      if (q && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, category, status]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} SKUs · ${products.filter((p) => statusFor(p) === "low_stock").length} low stock`}
        actions={
          <>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Upload className="size-4" /> Import
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Download className="size-4" /> Export
            </Button>
            <Link to="/products/new">
              <Button className="gap-2 rounded-xl"><Plus className="size-4" /> Add product</Button>
            </Link>
          </>
        }
      />

      <Card className="mb-4 rounded-2xl border-border p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search SKU, name, brand…" className="h-9 rounded-lg border-transparent bg-muted pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-[170px] rounded-lg"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[150px] rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="rounded-lg"><Filter className="size-4" /></Button>
          <div className="ml-auto flex overflow-hidden rounded-lg border border-border">
            <button onClick={() => setView("list")} className={cn("grid size-9 place-items-center", view === "list" ? "bg-muted text-foreground" : "text-muted-foreground")}>
              <List className="size-4" />
            </button>
            <button onClick={() => setView("grid")} className={cn("grid size-9 place-items-center border-l border-border", view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground")}>
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </Card>

      {view === "list" ? (
        <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Category · Brand</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3 text-right">Total qty</th>
                  <th className="px-5 py-3 text-right">Price / box</th>
                  <th className="px-5 py-3 text-right">Unit</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="cursor-pointer transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link to="/products/$id" params={{ id: p.id }} className="flex items-center gap-3">
                        <img src={p.image} alt="" className="size-10 rounded-lg object-cover ring-1 ring-border" />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <p className="text-foreground">{p.category}</p>
                      <p className="text-[11px]">{p.brand}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">
                      <p>{p.boxes} boxes</p>
                      <p className="text-[11px] text-muted-foreground">× {p.itemsPerBox} + {p.extraPieces}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold">{totalQty(p)}</td>
                    <td className="px-5 py-3 text-right font-mono">{moneyExact(p.pricePerBox)}</td>
                    <td className="px-5 py-3 text-right font-mono">{moneyExact(p.individualPrice)}</td>
                    <td className="px-5 py-3 text-right"><StatusBadge status={statusFor(p)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No products match your filters.</div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Link key={p.id} to="/products/$id" params={{ id: p.id }}>
              <Card className="group overflow-hidden rounded-2xl border-border p-0 transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={p.image} alt={p.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.category} · {p.brand}</p>
                    </div>
                    <StatusBadge status={statusFor(p)} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-mono text-base font-semibold">{moneyExact(p.individualPrice)}</span>
                    <span className="text-[11px] text-muted-foreground">{totalQty(p)} in stock</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card className="col-span-full rounded-2xl border-dashed p-10 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-3 size-8 text-muted-foreground" /> No products match your filters.
            </Card>
          )}
        </div>
      )}
    </>
  );
}