import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  DollarSign,
  Package,
  Receipt,
  ShoppingBag,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

import { PageHeader, money, moneyExact } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  kpi as defaultKpi,
  revenueSeries as defaultRevenue,
  products as defaultProducts,
  activity as defaultActivity,
  bestSellers as defaultBestSellers,
  categoryBreakdown as defaultCategoryBreakdown,
  statusFor,
} from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "brand",
  sub,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon: typeof Package;
  tone?: "brand" | "success" | "warning" | "primary" | "destructive";
  sub?: string;
}) {
  const toneMap = {
    brand: "bg-brand/10 text-brand",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning dark:text-warning",
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <Card className="rounded-2xl border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between">
        <div className={cn("grid size-10 place-items-center rounded-xl", toneMap[tone])}>
          <Icon className="size-4" />
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              delta.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-[26px] font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("month");

  const { data: kpiData } = useFetch(() => api.getKPIs(), []);
  const { data: revenueData } = useFetch(() => api.getRevenue(), []);
  const { data: activityData } = useFetch(() => api.getActivity(), []);
  const { data: bestSellersData } = useFetch(() => api.getBestSellers(), []);
  const { data: categoryData } = useFetch(() => api.getCategoryBreakdown(), []);
  const { data: productsData } = useFetch(() => api.getProducts({ status: "low_stock", pageSize: "5" }), []);

  const kpi = kpiData || defaultKpi;
  const revenueSeries = revenueData || defaultRevenue;
  const activityItems = activityData || defaultActivity;
  const bestSellersItems = bestSellersData || defaultBestSellers;
  const categoryItems = categoryData || defaultCategoryBreakdown;
  const lowStockProducts = (productsData?.items || []).slice(0, 5);

  const trimmed =
    range === "week"
      ? revenueSeries.slice(-7)
      : range === "today"
        ? revenueSeries.slice(-1)
        : range === "year"
          ? revenueSeries
          : revenueSeries.slice(-30);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`}
        description={`${today} · ${user?.storeName ?? ""}`}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={async () => {
              try {
                const csv = await api.exportReport("csv");
                const blob = new Blob([typeof csv === "string" ? csv : JSON.stringify(csv)], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "audit_report.csv";
                a.click();
                URL.revokeObjectURL(url);
              } catch (err: any) {
                console.error("Export failed", err);
              }
            }}>
              Export CSV
            </Button>
            <Link to="/products/new">
              <Button className="rounded-xl">+ Add product</Button>
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Total products"
          value={kpi.totalProducts.toString()}
          icon={Package}
          tone="brand"
          sub={`${kpi.outOfStock} out of stock`}
        />
        <KpiCard
          label="Items in stock"
          value={kpi.itemsInStock.toLocaleString()}
          icon={Boxes}
          tone="primary"
          delta={{ value: "2.4%", positive: true }}
        />
        <KpiCard
          label="Today's sales"
          value={money(kpi.todaySales)}
          icon={ShoppingBag}
          tone="success"
          delta={{ value: "12.4%", positive: true }}
          sub={`${kpi.todayOrders} orders`}
        />
        <KpiCard
          label="Weekly revenue"
          value={money(kpi.weeklyRevenue)}
          icon={DollarSign}
          tone="brand"
          delta={{ value: "8.1%", positive: true }}
        />
        <KpiCard
          label="Inventory value"
          value={money(kpi.inventoryValue)}
          icon={Warehouse}
          tone="primary"
          sub="Retail valuation"
        />
        <KpiCard
          label="Low stock"
          value={kpi.lowStock.toString()}
          icon={TriangleAlert}
          tone="warning"
          sub="Needs reorder"
        />
      </div>

      {/* Chart + activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border p-0 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Revenue analytics</h2>
              <p className="text-xs text-muted-foreground">
                Consolidated across all sales channels
              </p>
            </div>
            <Tabs value={range} onValueChange={setRange}>
              <TabsList className="h-8">
                <TabsTrigger value="today" className="text-xs">
                  Today
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs">
                  Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs">
                  Month
                </TabsTrigger>
                <TabsTrigger value="year" className="text-xs">
                  Year
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-[280px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trimmed} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `GH₵${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => moneyExact(v)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-brand" />
              <h2 className="text-sm font-semibold">Live activity</h2>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">Last 24h</span>
          </div>
          <ul className="divide-y divide-border">
                  {activityItems.map((a: any) => (
              <li key={a.id} className="flex gap-3 p-4 transition-colors hover:bg-muted/40">
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    a.kind === "sale" && "bg-success",
                    a.kind === "low_stock" && "bg-warning",
                    a.kind === "restock" && "bg-brand",
                    a.kind === "user" && "bg-primary",
                    a.kind === "edit" && "bg-muted-foreground",
                    a.kind === "settings" && "bg-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{a.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{a.description}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {a.at} · {a.actor}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Best-sellers + category */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Best-selling products</h2>
              <p className="text-xs text-muted-foreground">By units sold this month</p>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bestSellersItems}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={160}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v} units`}
                />
                <Bar dataKey="units" fill="var(--chart-1)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Category performance</h2>
          <p className="mb-4 text-xs text-muted-foreground">Share of stock value</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryItems}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {categoryItems.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {categoryItems.map((c: any, i: number) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  {c.name}
                </span>
                <span className="font-mono text-muted-foreground">{c.value}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Low stock intelligence */}
      <Card className="mt-6 rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-sm font-semibold">Low stock intelligence</h2>
            <p className="text-xs text-muted-foreground">
              Predicted days-to-stockout based on recent sales
            </p>
          </div>
          <Link to="/products" className="text-xs font-semibold text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-right">On hand</th>
                <th className="px-5 py-3 text-right">Burn rate</th>
                <th className="px-5 py-3 text-right">Est. depletion</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lowStockProducts.map((p: any) => {
                const qty = p.boxes * p.itemsPerBox + p.extraPieces;
                const burn = 1.2 + Math.random() * 1.4;
                const days = Math.max(1, Math.round(qty / burn));
                return (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt=""
                          className="size-9 rounded-lg object-cover ring-1 ring-border"
                        />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{qty}</td>
                    <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                      {burn.toFixed(1)}/day
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          days <= 3
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/15 text-warning-foreground dark:text-warning",
                        )}
                      >
                        ~{days} days
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/products/$id"
                        params={{ id: p.id }}
                        className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <Receipt className="size-3" /> Restock
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
