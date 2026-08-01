import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, SubmitButton } from "@/components/vanta/field";
import { useLoading } from "@/components/vanta/loading";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in to Vanta Oil" },
      {
        name: "description",
        content: "Access your Vanta Oil account to review your energy portfolio and products.",
      },
      { property: "og:title", content: "Sign in to Vanta Oil" },
      {
        property: "og:description",
        content: "Access your Vanta Oil account to review your energy portfolio and products.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or phone number").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { startLoading } = useLoading();
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      identifier: String(form.get("identifier") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    if (!parsed.success) {
      const next: Partial<Record<string, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const { identifier, password } = parsed.data;
    const credentials = identifier.includes("@")
      ? { email: identifier, password }
      : { phone: identifier.replace(/[^\d+]/g, ""), password };
    const { error } = await supabase.auth.signInWithPassword(credentials);
    setSubmitting(false);

    if (error) {
      toast.error("We couldn't sign you in", { description: error.message });
      return;
    }

    toast.success("Login successful", { description: "Welcome back to Vanta Oil." });
    startLoading(1800);
    navigate({ to: "/home" });
  }

  async function handleForgotPassword() {
    const input = document.querySelector<HTMLInputElement>('input[name="identifier"]');
    const email = input?.value.trim() ?? "";
    if (!email.includes("@")) {
      toast.error("Enter your email address first", {
        description: "We'll send a secure reset link to it.",
      });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent", { description: `Check ${email} for instructions.` });
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Vanta Oil"
      description="Your portfolio, products and account in one calm place."
      footer={
        <>
          New to Vanta Oil?{" "}
          <Link to="/register" className="font-semibold text-accent-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Email or phone"
          name="identifier"
          autoComplete="username"
          placeholder="you@company.com"
          error={errors["identifier"]}
        />
        <Field
          label="Password"
          name="password"
          toggleable
          autoComplete="current-password"
          placeholder="Your password"
          error={errors["password"]}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4.5 w-4.5 rounded-md accent-[oklch(0.71_0.113_92.3)]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-[13px] font-semibold text-accent-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <SubmitButton loading={submitting}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}
