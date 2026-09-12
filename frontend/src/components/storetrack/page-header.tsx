import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: "in_stock" | "low_stock" | "out_of_stock" }) {
  const map = {
    in_stock: { label: "In stock", cls: "bg-success/10 text-success ring-success/20" },
    low_stock: {
      label: "Low stock",
      cls: "bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning",
    },
    out_of_stock: {
      label: "Out of stock",
      cls: "bg-destructive/10 text-destructive ring-destructive/20",
    },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export const money = (n: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: n < 100 ? 2 : 0,
  }).format(n);

export const moneyExact = (n: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(n);
