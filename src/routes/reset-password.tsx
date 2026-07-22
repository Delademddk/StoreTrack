import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]">
        {!sent ? (
          <>
            <div className="mb-6">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <Mail className="size-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your account email and we'll send a secure reset link.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.includes("@")) return toast.error("Enter a valid email");
                setSent(true);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  placeholder="you@company.com"
                />
              </div>
              <Button type="submit" className="h-11 w-full">
                Send reset link
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Remembered it?{" "}
                <Link to="/login" className="font-medium text-brand hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="text-lg font-semibold">Check your inbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a reset link to <span className="font-medium text-foreground">{email}</span>.
              It expires in 30 minutes.
            </p>
            <Link to="/login">
              <Button className="mt-6 w-full">Back to sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
