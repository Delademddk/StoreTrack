import { createFileRoute } from "@tanstack/react-router";
import { Minus, Package, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatusBadge, moneyExact } from "@/components/storetrack/page-header";
import { CheckoutModal, type CheckoutConfirmPayload } from "@/components/storetrack/checkout-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { categories as defaultCategories, products as defaultProducts, statusFor, totalQty, type Product } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
});

/**
 * Cart line item. A single line represents one product and can carry BOTH
 * a box quantity and a loose-item quantity for boxed products. For non-boxed
 * products only `pieceQty` is used and `boxQty` stays 0.
 *
 * Structured so a future "open box" workflow can convert available boxes into
 * loose stock (decrement `boxes`, add `itemsPerBox` to `extraPieces`) without
 * changing this shape.
 */
interface CartItem {
  id: string;
  name: string;
  isBoxed: boolean;
  pricePerBox: number;
  individualPrice: number;
  itemsPerBox: number;
  availableBoxes: number;
  availablePieces: number;
  boxQty: number;
  pieceQty: number;
}

const lineTotal = (i: CartItem) => i.boxQty * i.pricePerBox + i.pieceQty * i.individualPrice;

function SalesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { data: categoriesData } = useFetch(() => api.getCategories(), []);
  const categories = (categoriesData || defaultCategories).map((c: any) => typeof c === "string" ? c : c.name);

  const { data: productsData } = useFetch(() => api.getProducts(), []);
  const [products, setProducts] = useState<Product[]>(defaultProducts);

  useEffect(() => {
    if (productsData?.items) setProducts(productsData.items);
  }, [productsData]);

  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!q || p.name.toLowerCase().includes(q.toLowerCase())),
  );

  const addToCart = (p: Product) => {
    setCart((c) => {
      if (c.some((i) => i.id === p.id)) {
        toast.info(`${p.name} is already in the cart`);
        return c;
      }
      return [
        ...c,
        {
          id: p.id,
          name: p.name,
          isBoxed: p.isBoxed,
          pricePerBox: p.pricePerBox,
          individualPrice: p.individualPrice,
          itemsPerBox: p.itemsPerBox,
          availableBoxes: p.isBoxed ? p.boxes : 0,
          availablePieces: p.isBoxed ? p.extraPieces : p.extraPieces,
          boxQty: 0,
          pieceQty: p.isBoxed ? 0 : 1,
        },
      ];
    });
  };

  const setBoxQty = (id: string, next: number) =>
    setCart((c) =>
      c.map((i) =>
        i.id === id
          ? { ...i, boxQty: Math.max(0, Math.min(i.availableBoxes, Math.floor(next || 0))) }
          : i,
      ),
    );

  const setPieceQty = (id: string, next: number) =>
    setCart((c) =>
      c.map((i) =>
        i.id === id
          ? { ...i, pieceQty: Math.max(0, Math.min(i.availablePieces, Math.floor(next || 0))) }
          : i,
      ),
    );

  const remove = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const subtotal = useMemo(() => cart.reduce((s, i) => s + lineTotal(i), 0), [cart]);
  const total = Math.max(0, subtotal - discount);

  const invalidLines = cart.filter((i) => i.boxQty === 0 && i.pieceQty === 0);
  const canCheckout = cart.length > 0 && invalidLines.length === 0 && total > 0;

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.error("Add at least one product to complete a sale");
      return;
    }
    if (invalidLines.length > 0) {
      toast.error("Every line item needs at least one box or one individual item");
      return;
    }
    setCheckoutOpen(true);
  };

  const handleConfirmCheckout = async (p: CheckoutConfirmPayload) => {
    try {
      const saleItems = cart.map((i) => ({
        productId: i.id,
        name: i.name,
        qty: i.boxQty * i.itemsPerBox + i.pieceQty,
        unitPrice: i.boxQty > 0 ? i.pricePerBox / i.itemsPerBox : i.individualPrice,
      }));
      await api.createSale({
        items: saleItems,
        subtotal: total,
        discount,
        tax: 0,
        total,
        method: p.method,
        onCredit: p.onCredit || false,
        customerId: p.customerId,
        amountPaid: p.amountPaid,
        expectedPaymentDate: p.expectedPaymentDate,
        notes: p.notes,
      });
      if (p.onCredit) {
        toast.success(`Credit sale recorded`);
      } else {
        toast.success(`Sale complete — ${moneyExact(total)} via ${p.method}`);
      }
      setCheckoutOpen(false);
      setCart([]);
      setDiscount(0);
      // Refresh products to get updated stock
      const refreshed = await api.getProducts();
      if (refreshed?.items) setProducts(refreshed.items);
    } catch (err: any) {
      toast.error(err?.message || "Failed to record sale");
    }
  };

  return (
    <>
      <PageHeader
        title="Sales terminal"
        description="Add products, take payment, and print a receipt."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Product picker */}
        <div>
          <Card className="rounded-2xl border-border p-3 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  className="h-9 rounded-lg border-transparent bg-muted pl-9"
                />
              </div>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="h-9 w-[170px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c: string) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const oos = statusFor(p) === "out_of_stock";
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  disabled={oos}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={p.image}
                      alt=""
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[13px] font-semibold">{p.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">
                        {moneyExact(p.individualPrice)}
                      </span>
                      <StatusBadge status={statusFor(p)} />
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.isBoxed
                        ? `${p.boxes} boxes · ${p.extraPieces} loose`
                        : `${totalQty(p)} in stock`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <Card className="sticky top-24 flex h-fit flex-col rounded-2xl border-border p-0 shadow-[var(--shadow-elevated)]">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-sm font-semibold">Current sale</h2>
            <span className="text-[11px] text-muted-foreground">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                <p>Tap a product to start a sale</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cart.map((i) => (
                  <CartRow
                    key={i.id}
                    item={i}
                    onBoxQty={(n) => setBoxQty(i.id, n)}
                    onPieceQty={(n) => setPieceQty(i.id, n)}
                    onRemove={() => remove(i.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <Separator />

          <div className="space-y-2 p-4 text-sm">
            <Row label="Subtotal" value={moneyExact(subtotal)} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="h-7 w-24 text-right font-mono text-xs"
              />
            </div>
            <Separator />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Grand total</span>
              <span className="font-mono text-xl font-semibold">{moneyExact(total)}</span>
            </div>
          </div>

          <div className="border-t border-border p-4">
            <Button
              className="h-11 w-full rounded-xl text-sm font-semibold"
              disabled={!canCheckout}
              onClick={openCheckout}
            >
              Complete sale
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Choose payment method &amp; credit options on the next step
            </p>
          </div>
        </Card>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={total}
        onConfirm={handleConfirmCheckout}
      />
    </>
  );
}

function CartRow({
  item,
  onBoxQty,
  onPieceQty,
  onRemove,
}: {
  item: CartItem;
  onBoxQty: (n: number) => void;
  onPieceQty: (n: number) => void;
  onRemove: () => void;
}) {
  const boxOver = item.boxQty > item.availableBoxes;
  const pieceOver = item.pieceQty > item.availablePieces;
  const empty = item.boxQty === 0 && item.pieceQty === 0;

  return (
    <li className="space-y-2 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {item.isBoxed ? `${moneyExact(item.pricePerBox)}/box · ` : ""}
            {moneyExact(item.individualPrice)}/item
          </p>
        </div>
        <span className="whitespace-nowrap font-mono text-sm font-semibold">
          {moneyExact(lineTotal(item))}
        </span>
        <button
          className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove line"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className={cn("grid gap-2", item.isBoxed ? "grid-cols-2" : "grid-cols-1")}>
        {item.isBoxed && (
          <QtyControl
            icon={<Package className="size-3" />}
            label="Boxes"
            value={item.boxQty}
            max={item.availableBoxes}
            onChange={onBoxQty}
            helper={`${item.availableBoxes} avail`}
          />
        )}
        <QtyControl
          label={item.isBoxed ? "Individual" : "Quantity"}
          value={item.pieceQty}
          max={item.availablePieces}
          onChange={onPieceQty}
          helper={`${item.availablePieces} avail`}
        />
      </div>

      {(boxOver || pieceOver || empty) && (
        <p className="text-[11px] text-destructive">
          {boxOver
            ? `Only ${item.availableBoxes} box${item.availableBoxes === 1 ? "" : "es"} available.`
            : pieceOver
              ? `Only ${item.availablePieces} loose item${item.availablePieces === 1 ? "" : "s"} available.`
              : "Enter at least one box or one individual item."}
        </p>
      )}
    </li>
  );
}

function QtyControl({
  label,
  value,
  max,
  onChange,
  helper,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
  helper?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
        </span>
        {helper && <span className="font-mono text-[10px] text-muted-foreground">{helper}</span>}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40"
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
        >
          <Minus className="size-3" />
        </button>
        <Input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 flex-1 text-center font-mono text-xs"
        />
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
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
