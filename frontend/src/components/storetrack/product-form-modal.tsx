import { useEffect, useMemo, useState } from "react";
import { Barcode, Package, Plus, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { suppliers, totalQty, type Product } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";

const CREATE_CATEGORY_VALUE = "__create_new_category__";

export type ProductDraft = Omit<Product, "id" | "sku" | "createdAt" | "updatedAt" | "image"> & {
  image?: string;
};

const emptyDraft = (defaultCategory: string): ProductDraft => ({
  name: "",
  category: defaultCategory,
  brand: "",
  supplier: suppliers[0],
  isBoxed: false,
  boxes: 0,
  itemsPerBox: 0,
  extraPieces: 0,
  pricePerBox: 0,
  individualPrice: 0,
  lowStockThreshold: 10,
  description: "",
  barcode: "",
  image: "",
});

export function ProductFormModal({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: Product | null;
  onSubmit: (draft: ProductDraft) => void;
}) {
  const { data: categoriesData } = useFetch(() => api.getCategories(), []);
  const categories = categoriesData || [];
  const [form, setForm] = useState<ProductDraft>(() => emptyDraft(categories[0]?.name ?? ""));
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const { id: _id, sku: _sku, createdAt: _c, updatedAt: _u, ...rest } = initial;
      setForm({ ...rest });
    } else {
      setForm(emptyDraft(categories[0]?.name ?? ""));
    }
    // Only reset when opening / switching the edited product.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const qty = useMemo(() => totalQty(form), [form]);

  const handleCategoryChange = (value: string) => {
    if (value === CREATE_CATEGORY_VALUE) {
      setCreateCategoryOpen(true);
      return;
    }
    set("category", value);
  };

  const handleCategoryCreated = async (name: string) => {
    try {
      const created = await api.createCategory({ name, color: "#6b7280", icon: "Package", description: "" });
      if (created) set("category", created.name);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create category");
    }
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Product name is required";
    if (!form.category) return "Category is required";
    if (form.individualPrice <= 0) return "Individual selling price is required";
    if (form.isBoxed) {
      if (form.boxes < 0 || form.itemsPerBox <= 0)
        return "Number of boxes and quantity per box are required";
      if (form.pricePerBox <= 0) return "Price per box is required";
      if (form.extraPieces < 0) return "Loose quantity cannot be negative";
    } else {
      if (form.extraPieces < 0) return "Individual quantity cannot be negative";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const normalized: ProductDraft = form.isBoxed
      ? form
      : { ...form, boxes: 0, itemsPerBox: 0, pricePerBox: 0 };
    onSubmit(normalized);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0 sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{mode === "create" ? "Add product" : "Edit product"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create a new SKU. Choose whether it is supplied in boxes to unlock box inventory."
                : "Update product details. Inventory adjustments are handled via Restock and Stock Correction actions."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-6 py-5">
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Product information
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Product name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Studio Pro Headphones"
                      className="h-10"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem
                            value={CREATE_CATEGORY_VALUE}
                            className="text-brand focus:text-brand"
                          >
                            <span className="flex items-center gap-2">
                              <Plus className="size-3.5" /> Create new category
                            </span>
                          </SelectItem>
                          <SelectSeparator />
                          {categories.map((c: any) => (
                            <SelectItem key={c.id || c.name} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Brand <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      value={form.brand}
                      onChange={(e) => set("brand", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Supplier <span className="text-muted-foreground">(optional)</span>
                    </Label>
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
                  <div className="space-y-1.5">
                    <Label>
                      Barcode <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.barcode ?? ""}
                        onChange={(e) => set("barcode", e.target.value)}
                        className="h-10 font-mono"
                        placeholder="8901234567890"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 shrink-0"
                        onClick={() =>
                          set("barcode", String(Math.floor(1e12 + Math.random() * 9e12)))
                        }
                        title="Generate barcode"
                      >
                        <Barcode className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>
                      Description <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">This product is supplied in boxes</p>
                    <p className="text-xs text-muted-foreground">
                      Enable to track boxes, items per box, and loose pieces separately.
                    </p>
                  </div>
                  <Switch checked={form.isBoxed} onCheckedChange={(v) => set("isBoxed", v)} />
                </div>

                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Inventory
                </h3>

                {form.isBoxed ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Number of boxes</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.boxes}
                        onChange={(e) => set("boxes", Math.max(0, Number(e.target.value)))}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quantity per box</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.itemsPerBox}
                        onChange={(e) => set("itemsPerBox", Math.max(0, Number(e.target.value)))}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Loose items</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.extraPieces}
                        onChange={(e) => set("extraPieces", Math.max(0, Number(e.target.value)))}
                        className="h-10"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Individual quantity</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.extraPieces}
                        onChange={(e) => set("extraPieces", Math.max(0, Number(e.target.value)))}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Low stock threshold</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.lowStockThreshold}
                        onChange={(e) =>
                          set("lowStockThreshold", Math.max(0, Number(e.target.value)))
                        }
                        className="h-10"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                      <Package className="size-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total quantity
                      </p>
                      <p className="font-mono text-xl font-semibold">{qty} units</p>
                    </div>
                  </div>
                  <p className="text-right text-[11px] text-muted-foreground">
                    {form.isBoxed
                      ? `${form.boxes} × ${form.itemsPerBox} + ${form.extraPieces}`
                      : "Individual stock"}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pricing
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.isBoxed && (
                    <div className="space-y-1.5">
                      <Label>Price per box</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.pricePerBox}
                        onChange={(e) => set("pricePerBox", Math.max(0, Number(e.target.value)))}
                        className="h-10 font-mono"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Individual selling price</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.individualPrice}
                      onChange={(e) => set("individualPrice", Math.max(0, Number(e.target.value)))}
                      className="h-10 font-mono"
                    />
                  </div>
                  {form.isBoxed && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Low stock threshold</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.lowStockThreshold}
                        onChange={(e) =>
                          set("lowStockThreshold", Math.max(0, Number(e.target.value)))
                        }
                        className="h-10"
                      />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Box price and individual price are independent — set each value freely.
                </p>
              </section>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2 rounded-xl">
              <Save className="size-4" />
              {mode === "create" ? "Save product" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
        <CreateCategoryModal
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          existing={categories.map((c: any) => c.name)}
          onCreate={handleCategoryCreated}
        />
      </DialogContent>
    </Dialog>
  );
}

function CreateCategoryModal({
  open,
  onOpenChange,
  existing,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: string[];
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Category name is required");
      return;
    }
    if (existing.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A category with this name already exists");
      return;
    }
    onCreate(trimmed);
    toast.success(`Category "${trimmed}" created`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
          <DialogDescription>
            Add a new category. You can enrich it later with a color, icon, or description.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Category name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beverages"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate(e);
            }}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" className="rounded-xl" onClick={handleCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
