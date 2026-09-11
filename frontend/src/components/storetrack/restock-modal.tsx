import { useEffect, useMemo, useState } from "react";
import { PackagePlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { totalQty, type Product } from "@/lib/mock-data";

export const RESTOCK_REASONS = [
  "Supplier Delivery",
  "Initial Stock",
  "Customer Return",
  "Inventory Correction",
  "Other",
] as const;

export type RestockReason = (typeof RESTOCK_REASONS)[number];

/**
 * Payload emitted by the Restock modal. Structured so a future inventory
 * timeline / audit log can persist it verbatim (reason, notes, actor,
 * timestamp are all derivable from a single record) without changing this
 * modal's contract.
 */
export interface RestockDraft {
  addBoxes: number;
  addPieces: number;
  reason: RestockReason;
  notes: string;
}

export function RestockModal({
  open,
  onOpenChange,
  product,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSubmit: (draft: RestockDraft) => void;
}) {
  const [addBoxes, setAddBoxes] = useState<string>("");
  const [addPieces, setAddPieces] = useState<string>("");
  const [reason, setReason] = useState<RestockReason>("Supplier Delivery");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAddBoxes("");
      setAddPieces("");
      setReason("Supplier Delivery");
      setNotes("");
    }
  }, [open, product?.id]);

  const parsed = useMemo(() => {
    const b = addBoxes === "" ? 0 : Number(addBoxes);
    const p = addPieces === "" ? 0 : Number(addPieces);
    return { b, p };
  }, [addBoxes, addPieces]);

  if (!product) return null;

  const projectedBoxes = product.boxes + (product.isBoxed ? parsed.b : 0);
  const projectedPieces = product.extraPieces + parsed.p;
  const projectedTotal = product.isBoxed
    ? projectedBoxes * product.itemsPerBox + projectedPieces
    : projectedPieces;

  const validate = (): string | null => {
    if (product.isBoxed) {
      if (!Number.isFinite(parsed.b) || parsed.b < 0)
        return "Boxes to add must be zero or a positive number";
      if (!Number.isInteger(parsed.b)) return "Boxes to add must be a whole number";
    }
    if (!Number.isFinite(parsed.p) || parsed.p < 0)
      return product.isBoxed
        ? "Loose items to add must be zero or a positive number"
        : "Individual quantity to add must be zero or a positive number";
    if (!Number.isInteger(parsed.p)) return "Quantity to add must be a whole number";
    if ((product.isBoxed ? parsed.b : 0) === 0 && parsed.p === 0)
      return "Enter at least one box or item to restock";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    onSubmit({
      addBoxes: product.isBoxed ? parsed.b : 0,
      addPieces: parsed.p,
      reason,
      notes: notes.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Restock product</DialogTitle>
            <DialogDescription className="truncate">
              {product.name}
              <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                · {product.sku}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current stock
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
              {product.isBoxed ? (
                <div>
                  <p className="text-[11px] text-muted-foreground">Boxes</p>
                  <p className="font-mono text-base font-semibold">{product.boxes}</p>
                </div>
              ) : (
                <div className="col-span-1">
                  <p className="text-[11px] text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">Individual</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground">
                  {product.isBoxed ? "Loose items" : "On hand"}
                </p>
                <p className="font-mono text-base font-semibold">{product.extraPieces}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Total qty</p>
                <p className="font-mono text-base font-semibold">{totalQty(product)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {product.isBoxed && (
              <div className="space-y-1.5">
                <Label>Add boxes</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={addBoxes}
                  onChange={(e) => setAddBoxes(e.target.value)}
                  placeholder="0"
                  className="h-10 font-mono"
                />
              </div>
            )}
            <div className={`space-y-1.5 ${product.isBoxed ? "" : "sm:col-span-2"}`}>
              <Label>{product.isBoxed ? "Add loose items" : "Add individual quantity"}</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={addPieces}
                onChange={(e) => setAddPieces(e.target.value)}
                placeholder="0"
                className="h-10 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as RestockReason)}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESTOCK_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Reference PO #, delivery note, etc."
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                New total quantity
              </p>
              <p className="font-mono text-lg font-semibold">{projectedTotal} units</p>
            </div>
            <p className="text-right text-[11px] text-muted-foreground">
              {product.isBoxed
                ? `${projectedBoxes} × ${product.itemsPerBox} + ${projectedPieces}`
                : `${projectedPieces} on hand`}
            </p>
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
            <Button type="submit" className="gap-2 rounded-xl">
              <PackagePlus className="size-4" /> Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
