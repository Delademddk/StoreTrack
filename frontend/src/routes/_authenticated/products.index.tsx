import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Download,
  Copy,
  Eye,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatusBadge, moneyExact } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  statusFor,
  totalQty,
  type Product,
} from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { ProductFormModal, type ProductDraft } from "@/components/storetrack/product-form-modal";
import { ProductImage } from "@/components/storetrack/product-image";
import { RestockModal, type RestockDraft } from "@/components/storetrack/restock-modal";
import { cn } from "@/lib/utils";
import { csvToObjects, downloadCsv, readTextFile, type CsvRow } from "@/lib/data-transfer";

export const Route = createFileRoute("/_authenticated/products/")({
  component: ProductsPage,
});

const dash = "—";

const PRODUCT_HEADERS = [
  "sku",
  "name",
  "category",
  "brand",
  "supplier",
  "isBoxed",
  "boxes",
  "itemsPerBox",
  "extraPieces",
  "pricePerBox",
  "individualPrice",
  "lowStockThreshold",
  "description",
  "barcode",
  "image",
  "createdAt",
  "updatedAt",
];

const REQUIRED_IMPORT_COLUMNS = [
  "name",
  "category",
  "isBoxed",
  "boxes",
  "itemsPerBox",
  "extraPieces",
  "pricePerBox",
  "individualPrice",
  "lowStockThreshold",
];

const skuFrom = (name: string) => {
  const slug =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 10) || "SKU";
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SKU-${slug}-${rand}`;
};

const placeholderImage = (name: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || "product")}`;

const productToRow = (p: Product): CsvRow => ({
  sku: p.sku,
  name: p.name,
  category: p.category,
  brand: p.brand,
  supplier: p.supplier,
  isBoxed: p.isBoxed,
  boxes: p.boxes,
  itemsPerBox: p.itemsPerBox,
  extraPieces: p.extraPieces,
  pricePerBox: p.pricePerBox,
  individualPrice: p.individualPrice,
  lowStockThreshold: p.lowStockThreshold,
  description: p.description,
  barcode: p.barcode,
  image: p.image,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const readNumber = (row: Record<string, string>, key: string, line: number) => {
  const value = Number(row[key]);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Line ${line}: ${key} must be a positive number or zero.`);
  }
  return value;
};

const readBoolean = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1", "boxed"].includes(normalized)) return true;
  if (["false", "no", "0", "individual"].includes(normalized)) return false;
  throw new Error("isBoxed must be true or false.");
};

function productFromRow(row: Record<string, string>, line: number): Product {
  const name = row.name?.trim();
  if (!name) throw new Error(`Line ${line}: name is required.`);

  const isBoxed = readBoolean(row.isBoxed ?? "");
  const boxes = Math.floor(readNumber(row, "boxes", line));
  const itemsPerBox = Math.floor(readNumber(row, "itemsPerBox", line));
  const extraPieces = Math.floor(readNumber(row, "extraPieces", line));
  const pricePerBox = readNumber(row, "pricePerBox", line);
  const individualPrice = readNumber(row, "individualPrice", line);
  const lowStockThreshold = Math.floor(readNumber(row, "lowStockThreshold", line));

  if (isBoxed && itemsPerBox <= 0) {
    throw new Error(`Line ${line}: boxed products need itemsPerBox greater than zero.`);
  }
  if (individualPrice <= 0) {
    throw new Error(`Line ${line}: individualPrice must be greater than zero.`);
  }

  const now = new Date().toISOString();
  return {
    id: `p_${Date.now()}_${line}`,
    sku: row.sku?.trim() || skuFrom(name),
    name,
    category: row.category?.trim() || "Uncategorized",
    brand: row.brand?.trim() || "",
    supplier: row.supplier?.trim() || "",
    isBoxed,
    boxes: isBoxed ? boxes : 0,
    itemsPerBox: isBoxed ? itemsPerBox : 0,
    extraPieces,
    pricePerBox: isBoxed ? pricePerBox : 0,
    individualPrice,
    lowStockThreshold,
    description: row.description?.trim() || "",
    barcode: row.barcode?.trim() || undefined,
    image: row.image?.trim() || placeholderImage(name),
    createdAt: row.createdAt?.trim() || now,
    updatedAt: row.updatedAt?.trim() || now,
  };
}

function ProductsPage() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const { data: categoriesData } = useFetch(() => api.getCategories(), []);
  const categories = (categoriesData || []).map((c: any) => typeof c === "string" ? c : c.name);

  const { data: productsData, refetch } = useFetch(() => api.getProducts(), []);

  useEffect(() => {
    if (productsData?.items) setItems(productsData.items);
  }, [productsData]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [restocking, setRestocking] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      const s = statusFor(p);
      if (status !== "all" && s !== status) return false;
      if (q && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [items, q, category, status]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleSubmit = async (draft: ProductDraft) => {
    try {
      const { imageFile, ...data } = draft;
      if (editing) {
        const updated = await api.updateProduct(editing.id, data);
        if (imageFile && updated?.id) {
          await api.uploadProductImage(updated.id, imageFile);
        } else if (imageFile === null && draft.image === "") {
          try {
            await api.deleteProductImage(editing.id);
          } catch {
            /* ignore if no image */
          }
        }
        toast.success("Product updated");
      } else {
        const created = await api.createProduct(data);
        if (imageFile && created?.id) {
          await api.uploadProductImage(created.id, imageFile);
        }
        toast.success("Product added");
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product");
    }
  };

  const handleDuplicate = async (p: Product) => {
    try {
      await api.duplicateProduct(p.id);
      toast.success("Product duplicated");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to duplicate");
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await api.deleteProduct(p.id);
      toast.success(`${p.name} deleted`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleRestock = async (product: Product, draft: RestockDraft) => {
    try {
      await api.restockProduct(product.id, draft);
      const parts = [
        draft.addBoxes > 0 ? `${draft.addBoxes} box${draft.addBoxes === 1 ? "" : "es"}` : null,
        draft.addPieces > 0 ? `${draft.addPieces} loose` : null,
      ].filter(Boolean);
      toast.success(`Restocked ${product.name}`, {
        description: `${parts.join(" · ")} · ${draft.reason}`,
      });
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to restock");
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${items.length} SKUs · ${items.filter((p) => statusFor(p) === "low_stock").length} low stock`}
        actions={
          <>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => importInputRef.current?.click()}>
              <Upload className="size-4" /> Import
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const result = await api.importProducts(text);
                  toast.success(`Imported ${result.imported} products`, {
                    description: result.errors?.length ? `${result.errors.length} errors` : undefined,
                  });
                  refetch();
                } catch (err: any) {
                  toast.error(err?.message || "Import failed");
                }
                e.target.value = "";
              }}
            />
            <Button variant="outline" className="gap-2 rounded-xl" onClick={async () => {
              try {
                const csv = await api.exportReport("products");
                const blob = new Blob([typeof csv === "string" ? csv : JSON.stringify(csv)], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "products_export.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Products exported");
              } catch (err: any) {
                toast.error(err?.message || "Export failed");
              }
            }}>
              <Download className="size-4" /> Export
            </Button>
            <Button className="gap-2 rounded-xl" onClick={openCreate}>
              <Plus className="size-4" /> Add product
            </Button>
          </>
        }
      />

      <Card className="mb-4 rounded-2xl border-border p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKU, name, brand…"
              className="h-9 rounded-lg border-transparent bg-muted pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-[170px] rounded-lg">
              <SelectValue placeholder="Category" />
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-[150px] rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="rounded-lg">
            <Filter className="size-4" />
          </Button>
          <div className="ml-auto flex overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setView("list")}
              className={cn(
                "grid size-9 place-items-center",
                view === "list" ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              <List className="size-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(
                "grid size-9 place-items-center border-l border-border",
                view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
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
                  <th className="px-5 py-3 text-right">Boxes</th>
                  <th className="px-5 py-3 text-right">Loose</th>
                  <th className="px-5 py-3 text-right">Total qty</th>
                  <th className="px-5 py-3 text-right">Price / box</th>
                  <th className="px-5 py-3 text-right">Individual</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  <th className="px-5 py-3 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="cursor-pointer transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link
                        to="/products/$id"
                        params={{ id: p.id }}
                        className="flex items-center gap-3"
                      >
                        <ProductImage
                          image={p.image}
                          name={p.name}
                          alt=""
                          className="size-10 rounded-lg object-cover ring-1 ring-border"
                        />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <p className="text-foreground">{p.category}</p>
                      <p className="text-[11px]">{p.brand || dash}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">
                      {p.isBoxed ? (
                        <>
                          <p>{p.boxes}</p>
                          <p className="text-[11px] text-muted-foreground">× {p.itemsPerBox}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{dash}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{p.extraPieces}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold">{totalQty(p)}</td>
                    <td className="px-5 py-3 text-right font-mono">
                      {p.isBoxed ? (
                        moneyExact(p.pricePerBox)
                      ) : (
                        <span className="text-muted-foreground">{dash}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">
                      {moneyExact(p.individualPrice)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge status={statusFor(p)} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RowActions
                        product={p}
                        onView={() => navigate({ to: "/products/$id", params: { id: p.id } })}
                        onEdit={() => openEdit(p)}
                        onRestock={() => setRestocking(p)}
                        onDuplicate={() => handleDuplicate(p)}
                        onDelete={() => setConfirmDelete(p)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No products match your filters.
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border-border p-0 transition-shadow hover:shadow-[var(--shadow-elevated)]"
            >
              <Link to="/products/$id" params={{ id: p.id }} className="block">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <ProductImage
                    image={p.image}
                    name={p.name}
                    alt={p.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {p.category} · {p.brand || dash}
                      </p>
                    </div>
                    <StatusBadge status={statusFor(p)} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="font-mono text-base font-semibold">
                      {moneyExact(p.individualPrice)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {totalQty(p)} in stock{p.isBoxed ? ` · ${p.boxes} boxes` : ""}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="absolute right-2 top-2">
                <RowActions
                  product={p}
                  onView={() => navigate({ to: "/products/$id", params: { id: p.id } })}
                  onEdit={() => openEdit(p)}
                  onRestock={() => setRestocking(p)}
                  onDuplicate={() => handleDuplicate(p)}
                  onDelete={() => setConfirmDelete(p)}
                  variant="floating"
                />
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="col-span-full rounded-2xl border-dashed p-10 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-3 size-8 text-muted-foreground" /> No products match
              your filters.
            </Card>
          )}
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <RestockModal
        open={!!restocking}
        onOpenChange={(o) => !o && setRestocking(null)}
        product={restocking}
        onSubmit={(draft) => {
          if (restocking) handleRestock(restocking, draft);
        }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete
                ? `"${confirmDelete.name}" will be removed from your catalog. This action cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) handleDelete(confirmDelete);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RowActions({
  product: _product,
  onView,
  onEdit,
  onRestock,
  onDuplicate,
  onDelete,
  variant = "inline",
}: {
  product: Product;
  onView: () => void;
  onEdit: () => void;
  onRestock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  variant?: "inline" | "floating";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant={variant === "floating" ? "secondary" : "ghost"}
          size="icon"
          className={cn(
            "size-8 rounded-lg",
            variant === "floating" &&
              "bg-background/90 opacity-0 shadow-sm ring-1 ring-border backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
          )}
          aria-label="Product actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={onView}>
          <Eye className="mr-2 size-4" /> View
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="mr-2 size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRestock}>
          <PackagePlus className="mr-2 size-4" /> Restock
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}>
          <Copy className="mr-2 size-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
