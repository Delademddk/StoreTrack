import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, LogOut } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activity } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Personal information, session, and recent activity."
        actions={
          <Button
            variant="outline"
            className="gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              logout();
              toast.success("Signed out");
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="grid size-16 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {user?.avatarInitials}
              </span>
              <button className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-brand text-brand-foreground ring-4 ring-background">
                <Camera className="size-3.5" />
              </button>
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {user?.role} · {user?.storeName}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input defaultValue={user?.name} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input defaultValue={user?.username} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue={user?.email} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input defaultValue="+254 700 000 000" className="h-10" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold">Session</p>
            <dl className="mt-4 space-y-2 text-xs">
              <Row label="Signed in from" value="Nairobi, KE · macOS" />
              <Row label="IP address" value="196.201.xxx.xxx" />
              <Row label="Last activity" value="Just now" />
            </dl>
          </Card>

          <Card className="rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
            <div className="border-b border-border p-4">
              <p className="text-sm font-semibold">Recent activity</p>
            </div>
            <ul className="divide-y divide-border">
              {activity.slice(0, 5).map((a) => (
                <li key={a.id} className="p-4">
                  <p className="text-xs font-semibold">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{a.at}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
