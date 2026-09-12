import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/storetrack/app-shell";

const ADMIN_ONLY_PATHS = ["/reports", "/users", "/settings"];

function isCashierRestricted(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export const Route = createFileRoute("/_authenticated")({
  // Session lives in localStorage — must be client-side.
  ssr: false,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const raw =
      localStorage.getItem("storetrack-session") ?? sessionStorage.getItem("storetrack-session");
    if (!raw) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.role === "Cashier" && isCashierRestricted(location.pathname)) {
        throw redirect({ to: "/dashboard" });
      }
    } catch {
      // redirect thrown above is intentional; ignore parse errors
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
