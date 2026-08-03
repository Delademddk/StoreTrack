import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown, Plus, Search, Users2 } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { EmptyState, PageHeader, moneyExact } from "@/components/storetrack/page-header";
import { CustomerFormModal } from "@/components/storetrack/customer-form-modal";
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
import { cn } from "@/lib/utils";
import {
  customerSummary,
  customersSnapshot,
  subscribeCustomers,
} from "@/lib/customers-store";

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
});

const PAGE_SIZE = 8;
type SortKey = "name" | "outstanding" | "lastPurchase";
type Filter = "all" | "clear" | "outstanding" | "overdue";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function useCustomers() {
  return useSyncExternalStore(
    (l) => subscribeCustomers(l),
    () => customersSnapshot(),
    () => customersSnapshot(),
  );
}

function CustomersPage() {
  const customers = useCustomers();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const rows = useMemo(() => {
    const enriched = customers.map((c) => ({ c, s: customerSummary(c.id) }));
    const filtered = enriched.filter(({ c, s }) => {
      if (q && !`${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter === "clear" && s.status !== "clear") return false;
      if (filter === "outstanding" && s.status === "clear") return false;
      if (filter === "overdue" && s.status !== "overdue") return false;
      return true;
    });
    filtered.sort((a, b) => {
      if (sort === "name") return a.c.name.localeCompare(b.c.name);
      if (sort === "outstanding") return b.s.outstanding - a.s.outstanding;
      return (b.s.lastPurchaseAt ?? "").localeCompare(a.s.lastPurchaseAt ?? "");
    });
    return filtered;
  }, [customers, q, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalOutstanding = rows.reduce((s, r) => s + r.s.outstanding, 0);
  const overdueCount = rows.filter((r) => r.s.status === "overdue").length;

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customers with credit balances and payment history."
        actions={
          <Button className="gap-2 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add customer
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total customers" value={String(customers.length)} />
        <SummaryCard
          label="Outstanding receivables"
          value={moneyExact(totalOutstanding)}
          tone={totalOutstanding > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="Overdue accounts"
          value={String(overdueCount)}
          tone={overdueCount > 0 ? "destructive" : "default"}
        />
      </div>

      <Card className="rounded-2xl border-border p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or phone…"
              className="h-9 rounded-lg border-transparent bg-muted pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="h-9 w-[170px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="clear">Clear balance</SelectItem>
              <SelectItem value="outstanding">Has outstanding</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[190px] rounded-lg">
              <ArrowUpDown className="mr-1 size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort · Name</SelectItem>
              <SelectItem value="outstanding">Sort · Outstanding</SelectItem>
              <SelectItem value="lastPurchase">Sort · Last purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
        {pageRows.length === 0 ? (
          <EmptyState
            icon={<Users2 className="size-5" />}
            title="No customers yet"
            description="Add customers when you record credit sales — you can also create them here."
            action={
              <Button className="gap-2 rounded-xl" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" /> Add customer
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                    <th className="px-4 py-3 text-right font-semibold">Outstanding</th>
                    <th className="px-4 py-3 text-left font-semibold">Last purchase</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map(({ c, s }) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          to="/customers/$id"
                          params={{ id: c.id }}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.phone}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {s.outstanding > 0 ? moneyExact(s.outstanding) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(s.lastPurchaseAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
                <span>
                  Page {currentPage} of {totalPages} · {rows.length} customer
                  {rows.length === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <CustomerFormModal open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "destructive";
}) {
  return (
    <Card className="rounded-2xl border-border p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function StatusPill({ status }: { status: "clear" | "outstanding" | "overdue" }) {
  const map = {
    clear: { label: "Clear", cls: "bg-success/10 text-success ring-success/20" },
    outstanding: {
      label: "Has outstanding",
      cls: "bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning",
    },
    overdue: {
      label: "Overdue",
      cls: "bg-destructive/10 text-destructive ring-destructive/20",
    },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        cls,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" /> {label}
    </span>
  );
}