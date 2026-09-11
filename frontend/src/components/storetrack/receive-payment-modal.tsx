import { useEffect, useState } from "react";
import { CreditCard, DollarSign, HandCoins, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { moneyExact } from "@/components/storetrack/page-header";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PaymentDraft = {
  amount: number;
  method: "Cash" | "Card" | "Mobile Money";
  reference?: string;
  notes?: string;
};

const METHODS: PaymentDraft["method"][] = ["Cash", "Card", "Mobile Money"];

export function ReceivePaymentModal({
  open,
  onOpenChange,
  customer,
  outstanding,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any | null;
  outstanding: number;
  onSubmit: (draft: PaymentDraft) => void;
}) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentDraft["method"]>("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setMethod("Cash");
      setReference("");
      setNotes("");
    }
  }, [open, customer?.id]);

  if (!customer) return null;

  const parsed = Number(amount) || 0;
  const newBalance = Math.max(0, outstanding - parsed);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed <= 0) return toast.error("Enter an amount greater than zero");
    if (parsed > outstanding + 0.001) {
      return toast.error(`Amount exceeds outstanding balance (${moneyExact(outstanding)})`);
    }
    onSubmit({ amount: parsed, method, reference: reference.trim(), notes: notes.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Receive payment</DialogTitle>
            <DialogDescription>
              {customer.name} · outstanding {moneyExact(outstanding)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-11 font-mono text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const Icon = m === "Cash" ? DollarSign : m === "Card" ? CreditCard : Smartphone;
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-medium transition-colors",
                      method === m
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" /> {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Reference <span className="text-muted-foreground">(opt)</span>
              </Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="MPESA-XXXX"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Notes <span className="text-muted-foreground">(opt)</span>
              </Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                New outstanding balance
              </p>
              <p className="font-mono text-lg font-semibold">{moneyExact(newBalance)}</p>
            </div>
            <p className="text-right text-[11px] text-muted-foreground">
              was {moneyExact(outstanding)}
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
              <HandCoins className="size-4" /> Save payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
