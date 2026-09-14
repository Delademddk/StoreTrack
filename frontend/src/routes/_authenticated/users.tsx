import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, MoreHorizontal, Plus, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/storetrack/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { permissions } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", username: "", email: "", phone: "", role: "Cashier" });

  const { data: usersData } = useFetch(() => api.getUsers(), []);

  useEffect(() => {
    if (usersData?.items) setUsers(usersData.items);
  }, [usersData]);

  const filtered = users.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (!q || `${u.name} ${u.email} ${u.username}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader
        title="Users & permissions"
        description={`${users.length} team members · role-based access control`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl">
                <UserPlus className="size-4" /> Add user
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <Field label="Full name" value={inviteForm.name} onChange={(v) => setInviteForm((f) => ({ ...f, name: v }))} />
                <Field label="Username" value={inviteForm.username} onChange={(v) => setInviteForm((f) => ({ ...f, username: v }))} />
                <Field label="Email" type="email" className="sm:col-span-2" value={inviteForm.email} onChange={(v) => setInviteForm((f) => ({ ...f, email: v }))} />
                <Field label="Phone" value={inviteForm.phone} onChange={(v) => setInviteForm((f) => ({ ...f, phone: v }))} />
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Admin", "Manager", "Cashier", "Keeper"].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-2 block">Permissions</Label>
                  <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-2">
                    {permissions.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-xs">
                        <Checkbox defaultChecked={p.includes("View")} /> {p}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await api.createUser({
                        name: inviteForm.name,
                        username: inviteForm.username,
                        email: inviteForm.email,
                        phone: inviteForm.phone,
                        role: inviteForm.role,
                      });
                      setOpen(false);
                      setInviteForm({ name: "", username: "", email: "", phone: "", role: "Cashier" });
                      toast.success("User created");
                      const refreshed = await api.getUsers();
                      if (refreshed?.items) setUsers(refreshed.items);
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to create user");
                    }
                  }}
                >
                  Send invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-4 rounded-2xl border-border p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users…"
              className="h-9 rounded-lg border-transparent bg-muted pl-9"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-9 w-[150px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {["Admin", "Manager", "Cashier", "Keeper"].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left">
                <Checkbox
                  onCheckedChange={(v) => setSelected(v ? filtered.map((u) => u.id) : [])}
                />
              </th>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Last active</th>
              <th className="px-5 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <Checkbox
                    checked={selected.includes(u.id)}
                    onCheckedChange={(v) =>
                      setSelected((s) => (v ? [...s, u.id] : s.filter((x) => x !== u.id)))
                    }
                  />
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                      u.status === "Active"
                        ? "bg-success/10 text-success ring-success/20"
                        : "bg-muted text-muted-foreground ring-border",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" /> {u.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{u.lastActive}</td>
                <td className="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.success("Edit user")}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          const newStatus = u.status === "Active" ? "Disabled" : "Active";
                          try {
                            await api.updateUserStatus(u.id, { status: newStatus });
                            setUsers((all) =>
                              all.map((x) => (x.id === u.id ? { ...x, status: newStatus } : x)),
                            );
                            toast.success(`${u.name} ${newStatus === "Active" ? "enabled" : "disabled"}`);
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to update user");
                          }
                        }}
                      >
                        {u.status === "Active" ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        try {
                          await api.resetUserPassword(u.id);
                          toast.success("Password reset successfully");
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to reset password");
                        }
                      }}>
                        <KeyRound className="mr-2 size-3.5" /> Reset password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={async () => {
                          try {
                            await api.deleteUser(u.id);
                            setUsers((all) => all.filter((x) => x.id !== u.id));
                            toast.success("User removed");
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to delete user");
                          }
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Field({
  label,
  type = "text",
  className,
  value = "",
  onChange,
}: {
  label: string;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <Input type={type} className="h-10" value={value} onChange={(e) => onChange?.(e.target.value)} />
    </div>
  );
}
