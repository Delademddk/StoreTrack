import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Barcode, ImagePlus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatusBadge, moneyExact } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { suppliers, statusFor, totalQty, type Product } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";

export const Route = createFileRoute("/_authenticated/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const { data: categoriesData } = useFetch(() => api.getCategories(), []);
  const categories = (categoriesData || []).map((c: any) => typeof c === "string" ? c : c.name);
  const [form, setForm] = useState({
    name: "",
    category: categories[0],
    brand: "",
    supplier: suppliers[0],
    boxes: 0,
    itemsPerBox: 1,
    extraPieces: 0,
    pricePerBox: 0,
    individualPrice: 0,
    lowStockThreshold: 10,
    description: "",
    barcode: "",
    image: "",
  });

  const set = (k: keyof typeof form, v: unknown) => setForm((s) => ({ ...s, [k]: v }));
  const qty = form.boxes * form.itemsPerBox + form.extraPieces;
  const previewStatus = statusFor({
    ...form,
    id: "preview",
    sku: "PREVIEW",
    createdAt: "",
    updatedAt: "",
  } as unknown as Product);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Product name is required");
    try {
      const product = await api.createProduct({
        name: form.name,
        category: form.category,
        brand: form.brand,
        supplier: form.supplier,
        isBoxed: form.boxes > 0 || form.itemsPerBox > 1,
        boxes: form.boxes,
        itemsPerBox: form.itemsPerBox,
        extraPieces: form.extraPieces,
        pricePerBox: form.pricePerBox,
        individualPrice: form.individualPrice,
        lowStockThreshold: form.lowStockThreshold,
        description: form.description,
        barcode: form.barcode,
        image: form.image,
      });
      toast.success("Product saved");
      navigate({ to: "/products" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create product");
    }
  };

  return (
    <>
      <PageHeader
        title="Add product"
        description="Add a new SKU to inventory with detailed stock and pricing information."
        actions={
          <Link to="/products">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
        }
      />

      <form onSubmit={onSave} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-semibold">Basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Product name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Studio Pro Headphones"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Input
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Supplier</Label>
                <Select value={form.supplier} onValueChange={(v) => set("supplier", v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-semibold">Inventory</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Boxes available</Label>
                <Input
                  type="number"
                  value={form.boxes}
                  onChange={(e) => set("boxes", Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Items per box</Label>
                <Input
                  type="number"
                  value={form.itemsPerBox}
                  onChange={(e) => set("itemsPerBox", Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Extra pieces</Label>
                <Input
                  type="number"
                  value={form.extraPieces}
                  onChange={(e) => set("extraPieces", Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 p-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Auto-calculated total
                    </p>
                    <p className="mt-1 font-mono text-xl font-semibold">{qty} units</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">boxes × items + extras</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Low stock threshold</Label>
                <Input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price per box</Label>
                <Input
                  type="number"
                  value={form.pricePerBox}
                  onChange={(e) => set("pricePerBox", Number(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Individual price</Label>
                <Input
                  type="number"
                  value={form.individualPrice}
                  onChange={(e) => set("individualPrice", Number(e.target.value))}
                  className="h-10"
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-semibold">Identification</h2>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label>Barcode (optional)</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => set("barcode", e.target.value)}
                  className="h-10 font-mono"
                  placeholder="8901234567890"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-xl"
                  onClick={() => set("barcode", String(Math.floor(1e12 + Math.random() * 9e12)))}
                >
                  <Barcode className="size-4" /> Generate
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Link to="/products">
              <Button type="button" variant="outline" className="rounded-xl">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2 rounded-xl">
              <Save className="size-4" /> Save product
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <div className="sticky top-24">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live preview
            </p>
            <Card className="overflow-hidden rounded-2xl border-border shadow-[var(--shadow-card)]">
              <div className="aspect-[4/3] bg-muted">
                {form.image ? (
                  <img src={form.image} alt="" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <div className="text-center">
                      <ImagePlus className="mx-auto mb-2 size-6" />
                      <p className="text-xs">Add product image</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{form.name || "Untitled product"}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {form.category} · {form.brand || "—"}
                    </p>
                  </div>
                  <StatusBadge status={previewStatus} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Unit price
                    </p>
                    <p className="font-mono text-base font-semibold">
                      {moneyExact(form.individualPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Box price
                    </p>
                    <p className="font-mono text-base font-semibold">
                      {moneyExact(form.pricePerBox)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      On hand
                    </p>
                    <p className="font-mono">{qty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Threshold
                    </p>
                    <p className="font-mono">{form.lowStockThreshold}</p>
                  </div>
                </div>
                {form.description && (
                  <p className="mt-3 text-[11px] text-muted-foreground">{form.description}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
