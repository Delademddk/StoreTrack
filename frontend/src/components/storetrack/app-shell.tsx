import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  Search,
  Settings as SettingsIcon,
  ShoppingCart,
  Sun,
  TrendingUp,
  User,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { api } from "@/lib/api";
import { useFetch } from "@/hooks/use-fetch";

type AppRole = "Admin" | "Manager" | "Cashier" | "Keeper";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  match?: string;
  roles?: AppRole[];
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package, match: "/products" },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/customers", label: "Customers", icon: UserRound, match: "/customers" },
  { to: "/reports", label: "Reports", icon: TrendingUp, roles: ["Admin", "Manager"] },
  { to: "/users", label: "Users", icon: Users, roles: ["Admin"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon, roles: ["Admin"] },
];

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const visibleNav = useMemo(
    () => NAV.filter((item) => !item.roles || (user?.role && item.roles.includes(user.role))),
    [user?.role],
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-3" : "px-6",
        )}
      >
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <div className="size-3.5 rounded-sm border-2 border-current" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              StoreTrack <span className="text-brand">V3</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {!collapsed && (
          <div className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
        )}
        {visibleNav.map((item) => {
          const active = item.match ? pathname.startsWith(item.match) : pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-brand/8 text-brand"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && "text-brand")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active && <span className="ml-auto size-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}

        {!collapsed && (
          <>
            <div className="px-3 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </div>
            <Link
              to="/profile"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/profile"
                  ? "bg-brand/8 text-brand"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <User className="size-4 shrink-0" />
              <span>Profile</span>
            </Link>
          </>
        )}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-xl bg-muted/60 p-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Storage</span>
              <span className="font-mono text-foreground">62%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full w-[62%] rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">6.2 GB of 10 GB used</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const { data: activityData } = useFetch(() => api.getActivity(), []);
  const activity = activityData || [];
  const unread = activity.length > 0 ? Math.min(activity.length, 3) : 0;
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--shadow-elevated)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-[11px] text-muted-foreground">{unread} unread</p>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  toast.success("Marked all as read");
                }}
                className="text-[11px] font-medium text-brand hover:underline"
              >
                Mark all as read
              </button>
            </div>
            <ScrollArea className="max-h-[380px]">
              <div className="divide-y divide-border">
                {activity.slice(0, 6).map((a: any) => (
                  <div key={a.id} className="flex gap-3 px-4 py-3 hover:bg-muted/50">
                    <div
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
                      <p className="truncate text-[13px] font-medium">{a.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{a.description}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{a.at}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t border-border bg-muted/40 px-4 py-2 text-center">
              <Link
                to="/reports"
                className="text-[11px] font-semibold text-brand hover:underline"
                onClick={() => setOpen(false)}
              >
                View activity feed
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  if (!parts.length) return null;
  return (
    <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
      <Link to="/dashboard" className="hover:text-foreground">
        StoreTrack
      </Link>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-border">/</span>
          <span className={cn(i === parts.length - 1 && "font-medium text-foreground")}>
            {decodeURIComponent(p).replace(/-/g, " ")}
          </span>
        </span>
      ))}
    </nav>
  );
}

function QuickActionFab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2 duration-200 animate-in fade-in slide-in-from-bottom-2">
          <Link
            to="/sales"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-elevated)] ring-1 ring-border hover:bg-accent"
          >
            <Receipt className="size-4 text-brand" /> New sale
          </Link>
          <Link
            to="/products/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-elevated)] ring-1 ring-border hover:bg-accent"
          >
            <Package className="size-4 text-brand" /> Add product
          </Link>
          <Link
            to="/products"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-elevated)] ring-1 ring-border hover:bg-accent"
          >
            <TrendingUp className="size-4 text-brand" /> Restock
          </Link>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:scale-105 hover:shadow-brand/40",
        )}
        aria-label="Quick actions"
      >
        {open ? <X className="size-5" /> : <Plus className="size-5" />}
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-r border-sidebar-border bg-sidebar p-0">
          <SidebarBody collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main region */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          {/* Mobile trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <PanelLeftOpen className="size-4" />
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Desktop collapse */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <Breadcrumbs />

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-64 rounded-full border-transparent bg-muted pl-9 pr-14 text-sm focus-visible:ring-2 focus-visible:ring-ring/30"
                placeholder="Search products, sales, users…"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <ThemeToggleButton />
            <NotificationsPopover />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-accent">
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {user?.avatarInitials ?? "?"}
                  </span>
                  <span className="hidden text-xs font-medium text-foreground md:block">
                    {user?.name}
                  </span>
                  <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user?.name}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 size-3.5" /> Profile
                  </Link>
                </DropdownMenuItem>
                {(user?.role === "Admin" || user?.role === "Manager") && (
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <SettingsIcon className="mr-2 size-3.5" /> Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    toast.success("Signed out");
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="mr-2 size-3.5" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>

        <QuickActionFab />
      </div>
    </div>
  );
}

export { Badge };
