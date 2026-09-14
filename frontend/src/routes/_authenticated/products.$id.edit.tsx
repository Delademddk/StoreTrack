import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { api, imageUrl } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categoriesData } = useFetch(() => api.getCategories(), []);
  const categories = (categoriesData || []).map((c: any) => typeof c === "string" ? c : c.name);

  useEffect(() => {
    api.getProduct(id).then((p) => {
      setProduct(p);
      setForm(p);
      setImagePreview(p.image || null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      toast.error("Invalid file type. Allowed: JPG, PNG, WebP");
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Allowed: JPG, PNG, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size: 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    set("image", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
            const { imageFile: _imageFile, ...data } = form;
            await api.updateProduct(product.id, data);
            if (imageFile) {
              await api.uploadProductImage(product.id, imageFile);
            } else if (imagePreview === null && product.image) {
              try {
                await api.deleteProductImage(product.id);
              } catch {
                /* ignore */
              }
            }
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
            <div className="space-y-1.5 md:col-span-2">
              <Label>Product image</Label>
              <div className="flex items-start gap-3">
                <div
                  className="grid size-20 place-items-center rounded-xl border border-dashed border-border bg-muted/40 overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imageUrl(imagePreview)} alt="" className="size-full object-cover" />
                  ) : (
                    <ImagePlus className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="size-3" />{" "}
                    {imagePreview ? "Change image" : "Choose image"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG, or WebP. Max 5MB.
                  </p>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-destructive hover:text-destructive"
                      onClick={handleImageRemove}
                    >
                      <Trash2 className="size-3" /> Remove
                    </Button>
                  )}
                </div>
              </div>
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
