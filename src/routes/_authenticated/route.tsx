import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/storetrack/app-shell";

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
