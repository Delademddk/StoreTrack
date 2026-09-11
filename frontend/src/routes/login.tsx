import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, hydrated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("alex");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated) navigate({ to: "/dashboard" });
  }, [hydrated, isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Enter a username");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password, remember);
      toast.success(`Welcome back, ${username}`);
      navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.4),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(30,58,138,0.6),transparent_60%)]" />
        <div className="relative flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <div className="size-4 rounded-sm border-2 border-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">StoreTrack V3</span>
        </div>
        <div className="relative space-y-6">
          <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            The command center for modern retail teams — inventory, sales, and insights in one calm
            surface.
          </p>
          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Full audit trail on every action</p>
                <p className="text-white/70">
                  Traceability from restock to sale, ready for compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative text-xs text-white/60">© 2026 StoreTrack, Inc.</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use any username to demo the app — data resets locally.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/reset-password"
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
              Remember me for 30 days
            </label>

            <Button
              type="submit"
              className="h-11 w-full gap-2 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected by industry-standard encryption. Your session is stored locally.
          </p>
        </div>
      </div>
    </div>
  );
}
