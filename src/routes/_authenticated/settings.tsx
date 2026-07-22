import { createFileRoute } from "@tanstack/react-router";
import { CloudDownload, CloudUpload, Palette, Shield, Store } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Store profile, inventory defaults, security, and backups."
      />

      <Tabs defaultValue="store">
        <TabsList>
          <TabsTrigger value="store">
            <Store className="mr-2 size-3.5" /> Store
          </TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 size-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 size-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-6">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Store name" defaultValue="Northside Hub — Main Depot" />
              <Field label="Email" type="email" defaultValue="ops@storetrack.io" />
              <Field label="Phone" defaultValue="+254 700 000 000" />
              <Field label="Currency" defaultValue="USD" />
              <Field
                label="Address"
                className="md:col-span-2"
                defaultValue="42 Riverside Drive, Nairobi 00100"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => toast.success("Store settings saved")}>Save changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Default low stock threshold" type="number" defaultValue="10" />
              <Field label="Tax rate (%)" type="number" defaultValue="8.5" />
              <Field
                label="Receipt footer"
                className="md:col-span-2"
                defaultValue="Thank you for shopping with us!"
              />
              <SwitchRow
                label="Enable barcode scanning"
                description="Use device camera to scan on the sales terminal."
                defaultChecked
              />
              <SwitchRow
                label="Low-stock email alerts"
                description="Notify managers when items dip below threshold."
                defaultChecked
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <p className="mb-3 text-sm font-semibold">Theme</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    theme === t
                      ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <p className="text-sm font-semibold capitalize">{t}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t === "system" ? "Follow OS preference" : `Always ${t}`}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <div className="space-y-4">
              <SwitchRow
                label="Two-factor authentication"
                description="Require an OTP for every sign-in on new devices."
              />
              <SwitchRow
                label="Session timeout"
                description="Auto sign-out after 30 minutes of inactivity."
                defaultChecked
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Current password" type="password" />
                <Field label="New password" type="password" />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Password updated")}>Update password</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-3">
              <Button className="gap-2 rounded-xl">
                <CloudDownload className="size-4" /> Export backup
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl">
                <CloudUpload className="size-4" /> Import backup
              </Button>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">File</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-right">Size</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { f: "backup-2026-07-11.zip", d: "Today · 09:00", s: "42.1 MB" },
                    { f: "backup-2026-07-10.zip", d: "Yesterday · 09:00", s: "41.8 MB" },
                    { f: "backup-2026-07-04.zip", d: "Jul 4 · 09:00", s: "40.6 MB" },
                  ].map((b) => (
                    <tr key={b.f} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-mono text-xs">{b.f}</td>
                      <td className="px-4 py-2 text-muted-foreground">{b.d}</td>
                      <td className="px-4 py-2 text-right font-mono">{b.s}</td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="ghost" size="sm">
                          Restore
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({
  label,
  type = "text",
  defaultValue,
  className,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <Input type={type} defaultValue={defaultValue} className="h-10" />
    </div>
  );
}

function SwitchRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
