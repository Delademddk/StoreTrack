import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/storetrack/page-header";
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
import { suppliers } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";

export const Route = createFileRoute("/_authenticated/products/$id/edit")({
  component: EditProductPage,
  notFoundComponent: () => (
    <div className="py-24 text-center">
      <p className="text-sm text-muted-foreground">Product not found.</p>
    </div>
  ),
});

function EditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [notFoundState, setNotFound] = useState(false);

  const { data: categoriesData } = useFetch(() => api.getCategories(), []);
  const categories = (categoriesData || []).map((c: any) => typeof c === "string" ? c : c.name);

  useEffect(() => {
    api.getProduct(id).then((p) => {
      setProduct(p);
      setForm(p);
    }).catch(() => setNotFound(true));
  }, [id]);

  if (notFoundState) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  if (!product || !form) return null;
  const set = (k: string, v: any) =>
    setForm((s: any) => ({ ...s, [k]: v }));

  return (
    <>
      <PageHeader
        title={`Edit · ${product.name}`}
        description={product.sku}
        actions={
          <Link to="/products/$id" params={{ id: product.id }}>
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
        }
      />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.updateProduct(product.id, form);
            toast.success("Product updated");
            navigate({ to: "/products/$id", params: { id: product.id } });
          } catch (err: any) {
            toast.error(err?.message || "Failed to update product");
          }
        }}
        className="space-y-6"
      >
        <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Product name</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label>Threshold</Label>
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
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={async () => {
              try {
                await api.deleteProduct(product.id);
                toast.success("Product deleted");
                navigate({ to: "/products" });
              } catch (err: any) {
                toast.error(err?.message || "Failed to delete product");
              }
            }}
          >
            <Trash2 className="size-4" /> Delete product
          </Button>
          <Button type="submit" className="gap-2 rounded-xl">
            <Save className="size-4" /> Save changes
          </Button>
        </div>
      </form>
    </>
  );
}
