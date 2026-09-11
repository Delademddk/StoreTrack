import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  CreditCard,
  DollarSign,
  Plus,
  Search,
  Smartphone,
  UserRound,
} from "lucide-react";

import { moneyExact } from "@/components/storetrack/page-header";
import { CustomerFormModal } from "@/components/storetrack/customer-form-modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { api } from "@/lib/api";

type Method = "Cash" | "Card" | "Mobile Money";
const METHODS: Method[] = ["Cash", "Card", "Mobile Money"];

export interface CheckoutConfirmPayload {
  method: Method;
  onCredit: boolean;
  customerId?: string;
  amountPaid?: number;
  expectedPaymentDate?: string;
  notes?: string;
}

function useCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => {
    api.getCustomers().then((data) => {
      if (data?.items) setCustomers(data.items);
    }).catch(() => {});
  }, []);
  return customers;
}

export function CheckoutModal({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (p: CheckoutConfirmPayload) => void;
}) {
  const [method, setMethod] = useState<Method>("Card");
  const [onCredit, setOnCredit] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [amountPaidStr, setAmountPaidStr] = useState<string>("0");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customers = useCustomers();

  useEffect(() => {
    if (open) {
      setMethod("Card");
      setOnCredit(false);
      setCustomerId(undefined);
      setQuery("");
      setAmountPaidStr("0");
      setExpectedDate("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  const selected = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return customers.slice(0, 6);
    const q = query.toLowerCase();
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
      .slice(0, 6);
  }, [customers, query]);

  const amountPaid = Math.max(0, Number(amountPaidStr) || 0);
  const outstanding = Math.max(0, total - amountPaid);

  const confirm = () => {
    if (onCredit) {
      if (!customerId) return setError("Select a customer for this credit sale");
      if (amountPaid > total + 0.001) {
        return setError("Amount paid cannot exceed the grand total");
      }
    }
    setError(null);
    onConfirm({
      method,
      onCredit,
      customerId: onCredit ? customerId : undefined,
      amountPaid: onCredit ? amountPaid : undefined,
      expectedPaymentDate: onCredit && expectedDate ? expectedDate : undefined,
      notes: onCredit && notes.trim() ? notes.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle>Complete sale</DialogTitle>
          <DialogDescription>
            Grand total{" "}
            <span className="font-mono font-semibold text-foreground">{moneyExact(total)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Payment method
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const Icon = m === "Cash" ? DollarSign : m === "Card" ? CreditCard : Smartphone;
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border py-3 text-[11px] font-medium transition-colors",
                      method === m
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4" />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60">
            <Checkbox
              checked={onCredit}
              onCheckedChange={(v) => setOnCredit(v === true)}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">Record this sale on credit</p>
              <p className="text-[11px] text-muted-foreground">
                Attach a customer and track the outstanding balance.
              </p>
            </div>
          </label>

          {onCredit && (
            <div className="space-y-4 duration-200 animate-in fade-in slide-in-from-top-1">
              {selected ? (
                <div className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand/5 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-9 place-items-center rounded-full bg-brand/15 text-brand">
                      <UserRound className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{selected.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {selected.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerId(undefined)}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by name or phone…"
                      className="h-10 rounded-lg bg-muted/40 pl-9"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-border">
                    {filtered.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                        No customers match.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {filtered.map((c) => {
                          const outstanding = c.outstanding || 0;
                          return (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => setCustomerId(c.id)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/50"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{c.name}</p>
                                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                                    {c.phone}
                                  </p>
                                </div>
                                {outstanding > 0 && (
                                  <span className="whitespace-nowrap font-mono text-[10px] text-warning">
                                    {moneyExact(outstanding)} due
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-[12px] font-medium text-brand hover:bg-brand/5"
                  >
                    <Plus className="size-3.5" /> Add new customer
                  </button>
                </div>
              )}

              {selected && (
                <>
                  <div className="space-y-1.5">
                    <Label>Amount paid</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amountPaidStr}
                      onChange={(e) => setAmountPaidStr(e.target.value)}
                      className="h-11 font-mono text-base"
                    />
                  </div>

                  <div className="grid gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm sm:grid-cols-3">
                    <SummaryCell label="Grand total" value={moneyExact(total)} />
                    <SummaryCell label="Amount paid" value={moneyExact(amountPaid)} />
                    <SummaryCell
                      label="Outstanding"
                      value={moneyExact(outstanding)}
                      tone={outstanding > 0 ? "warning" : "success"}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <CalendarClock className="size-3.5" /> Expected payment date
                        <span className="text-muted-foreground">(opt)</span>
                      </Label>
                      <Input
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>
                        Notes <span className="text-muted-foreground">(opt)</span>
                      </Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Purchase order, terms…"
                        className="h-10"
                      />
                    </div>
                  </div>
                  {notes.length > 60 && (
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  )}
                </>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="mt-5">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={confirm} className="gap-2 rounded-xl">
            <Check className="size-4" />
            {onCredit ? "Save credit sale" : "Complete sale"}
          </Button>
        </DialogFooter>

        <CustomerFormModal
          open={addOpen}
          onOpenChange={setAddOpen}
          onCreated={(c) => setCustomerId(c.id)}
        />
      </DialogContent>
    </Dialog>
  );
}

function SummaryCell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm font-semibold",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
    </div>
  );
}
