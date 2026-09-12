import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, money } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  auditLog as defaultAuditLog,
  bestSellers as defaultBestSellers,
  kpi as defaultKpi,
  revenueSeries as defaultRevenueSeries,
} from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: metrics } = useFetch(() => api.getReportMetrics(), []);
  const { data: revenueData } = useFetch(() => api.getRevenueTrend(30), []);
  const { data: bestSellersData } = useFetch(() => api.getTopProducts(), []);
  const { data: auditData } = useFetch(() => api.getAuditLog(), []);

  const kpi = metrics || defaultKpi;
  const revenueSeries = revenueData || defaultRevenueSeries;
  const bestSellers = bestSellersData || defaultBestSellers;
  const auditLog = auditData || defaultAuditLog;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: string) => {
    try {
      if (format === "csv") {
        const csv = await api.exportReport("csv");
        downloadFile(typeof csv === "string" ? csv : JSON.stringify(csv), "audit_report.csv", "text/csv");
        toast.success("Audit report exported as CSV");
      } else {
        toast.info(`${format.toUpperCase()} export is available via CSV`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Export failed");
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Sales, inventory, and audit trails — exportable to PDF, CSV, and Excel."
        actions={
          <>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => handleExport("pdf")}>
              <FileText className="size-4" /> PDF
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
            <Button className="gap-2 rounded-xl" onClick={() => handleExport("csv")}>
              <Download className="size-4" /> CSV
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Daily sales" value={money(kpi.dailySales ?? kpi.todaySales)} tone="brand" />
        <Metric label="Weekly revenue" value={money(kpi.weeklyRevenue)} tone="success" />
        <Metric label="Monthly revenue" value={money(kpi.monthlyRevenue)} tone="primary" />
        <Metric label="Inventory value" value={money(kpi.inventoryValue)} tone="warning" />
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4 space-y-6">
          <Card className="rounded-2xl border-border p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-semibold">Revenue trend (30d)</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueSeries} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <Card className="rounded-2xl border-border p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-4 text-sm font-semibold">Top-selling products</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} margin={{ top: 4, right: 4, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Timestamp</th>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-left">Target</th>
                  <th className="px-5 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLog.map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-[11px] text-muted-foreground">
                      {l.at}
                    </td>
                    <td className="px-5 py-3">{l.user}</td>
                    <td className="px-5 py-3 font-medium">{l.action}</td>
                    <td className="px-5 py-3 font-mono text-xs text-brand">{l.target}</td>
                    <td className="px-5 py-3 text-muted-foreground">{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "success" | "primary" | "warning";
}) {
  const toneCls = {
    brand: "from-brand/10 to-transparent border-brand/20",
    success: "from-success/10 to-transparent border-success/20",
    primary: "from-primary/10 to-transparent border-primary/20",
    warning: "from-warning/15 to-transparent border-warning/20",
  }[tone];
  return (
    <Card className={`rounded-2xl border p-4 bg-gradient-to-br ${toneCls}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold">{value}</p>
    </Card>
  );
}
