import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, HandCoins, ShoppingBag, Wallet } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { PageHeader, moneyExact } from "@/components/storetrack/page-header";
import { ReceivePaymentModal } from "@/components/storetrack/receive-payment-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  customerSummarySnapshot,
  getCustomer,
  ledgerSnapshot,
  recordPayment,
  subscribeCustomers,
  type LedgerEntry,
} from "@/lib/customers-store";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetailPage,
  notFoundComponent: CustomerNotFound,
});

function CustomerNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <h2 className="text-lg font-semibold">Customer not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This customer may have been removed.
      </p>
      <Button asChild className="mt-4 rounded-xl">
        <Link to="/customers">Back to customers</Link>
      </Button>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function useSnapshot<T>(read: () => T): T {
  return useSyncExternalStore(
    (l) => subscribeCustomers(l),
    read,
    read,
  );
}

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const customer = useSnapshot(() => getCustomer(id));
  const ledger = useSnapshot(() => ledgerSnapshot(id));
  const summary = useSnapshot(() => customerSummarySnapshot(id));
  const [payOpen, setPayOpen] = useState(false);

  if (!customer) {
    throw notFound();
  }

  const history = useMemo(() => [...ledger].reverse(), [ledger]);

  return (
    <>
      <div className="mb-3">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to customers
        </Link>
      </div>

      <PageHeader
        title={customer.name}
        description={customer.phone}
        actions={
          <Button
            className="gap-2 rounded-xl"
            onClick={() => setPayOpen(true)}
            disabled={summary.outstanding <= 0}
          >
            <HandCoins className="size-4" /> Receive payment
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card className="rounded-2xl border-border p-5 shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer information
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <InfoRow label="Name" value={customer.name} />
              <InfoRow label="Phone" value={customer.phone} mono />
              <InfoRow label="Address" value={customer.address ?? "—"} />
              <InfoRow label="Notes" value={customer.notes ?? "—"} />
              <InfoRow label="Created" value={fmtDate(customer.createdAt)} />
            </div>
          </Card>

          <Card className="rounded-2xl border-border p-5 shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Financial summary
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <StatTile
                icon={<ShoppingBag className="size-4" />}
                label="Total purchases"
                value={moneyExact(summary.totalPurchases)}
              />
              <StatTile
                icon={<Wallet className="size-4" />}
                label="Total paid"
                value={moneyExact(summary.totalPaid)}
                tone="success"
              />
              <StatTile
                icon={<HandCoins className="size-4" />}
                label="Outstanding balance"
                value={moneyExact(summary.outstanding)}
                tone={summary.outstanding > 0 ? "warning" : "default"}
              />
              <div className="rounded-xl bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                <span className="font-semibold text-foreground">Last purchase:</span>{" "}
                {summary.lastPurchaseAt ? fmtDate(summary.lastPurchaseAt) : "—"}
              </div>
              {summary.nextDueAt && summary.outstanding > 0 && (
                <div className="rounded-xl bg-warning/10 px-3 py-2 text-[12px] text-warning">
                  <span className="font-semibold">Next payment due:</span>{" "}
                  {fmtDate(summary.nextDueAt)}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <p className="text-sm font-semibold">Transaction history</p>
              <p className="text-[11px] text-muted-foreground">
                {ledger.length} entr{ledger.length === 1 ? "y" : "ies"} · newest first
              </p>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No transactions yet — record a credit sale to see it here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((e) => (
                <TxRow key={e.id} entry={e} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ReceivePaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        customer={customer}
        outstanding={summary.outstanding}
        onSubmit={(draft) => {
          recordPayment(customer.id, draft);
          toast.success(`Payment of ${moneyExact(draft.amount)} recorded`);
        }}
      />
    </>
  );
}

function TxRow({ entry }: { entry: LedgerEntry }) {
  const isPurchase = entry.kind === "purchase";
  return (
    <li className="flex items-start gap-4 p-4 hover:bg-muted/30">
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          isPurchase ? "bg-brand/10 text-brand" : "bg-success/10 text-success",
        )}
      >
        {isPurchase ? <ShoppingBag className="size-4" /> : <HandCoins className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">
            {isPurchase ? "Purchase" : "Payment"}
            {entry.method && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {entry.method}
              </span>
            )}
          </p>
          <span
            className={cn(
              "whitespace-nowrap font-mono text-sm font-semibold",
              isPurchase ? "text-foreground" : "text-success",
            )}
          >
            {isPurchase ? "+" : "−"}
            {moneyExact(entry.amount)}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {new Date(entry.at).toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {(entry.lineSummary || entry.reference || entry.notes) && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            {[entry.lineSummary, entry.reference, entry.notes].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          Balance after: {moneyExact(entry.balanceAfter)}
        </p>
      </div>
    </li>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-sm text-foreground", mono && "font-mono text-[13px]")}>{value}</p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/15 text-warning",
          tone === "default" && "bg-brand/10 text-brand",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "font-mono text-base font-semibold",
            tone === "warning" && "text-warning",
            tone === "success" && "text-success",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}