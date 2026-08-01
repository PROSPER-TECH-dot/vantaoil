import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { PillInput, PasswordInput, PillButton } from "@/components/vanta/auth-ui";
import { useLoading } from "@/components/vanta/loading";
import { useCenterToast } from "@/components/vanta/center-toast";
import { phoneToEmail } from "@/lib/phone";
import authImage from "@/assets/oil-auth.jpg";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Vanta Oil" },
      {
        name: "description",
        content: "Create your Vanta Oil account with your phone number and start investing in oil.",
      },
      { property: "og:title", content: "Register — Vanta Oil" },
      {
        property: "og:description",
        content: "Create your Vanta Oil account with your phone number and start investing in oil.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    phone: z.string().trim().min(6, "Enter your phone number").max(15),
    password: z.string().min(6, "Use at least 6 characters").max(72),
    confirmPassword: z.string(),
    inviteCode: z.string().trim().max(20).optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function RegisterPage() {
  const navigate = useNavigate();
  const { startLoading } = useLoading();
  const { showCenterToast } = useCenterToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      inviteCode: String(form.get("inviteCode") ?? ""),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const phone = `+256${parsed.data.phone.replace(/\D/g, "").replace(/^0+/, "")}`;
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(parsed.data.phone),
      password: parsed.data.password,
      options: {
        data: {
          full_name: phone,
          phone,
          invite_code: parsed.data.inviteCode ?? "",
        },
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    showCenterToast("Account created successfully");

    if (!data.session) {
      navigate({ to: "/login" });
      return;
    }

    startLoading(1800);
    navigate({ to: "/home" });
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night text-night-foreground">
      <img
        src={authImage}
        alt="Oil mining pumpjack at dusk"
        width={1024}
        height={1024}
        className="pointer-events-none absolute inset-x-0 top-0 h-[46vh] w-full object-cover opacity-90"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[46vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--night) 45%, transparent) 0%, transparent 25%, color-mix(in oklab, var(--night) 92%, transparent) 80%, var(--night) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-8 pt-[46vh] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <h1 className="text-center text-[2.6rem] leading-none font-normal">Register</h1>

        <form onSubmit={handleSubmit} className="mt-auto space-y-4" noValidate>
          <PillInput
            prefix="+256"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Enter phone number"
            error={errors["phone"]}
          />
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="Enter password"
            error={errors["password"]}
          />
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter password"
            error={errors["confirmPassword"]}
          />
          <PillInput
            name="inviteCode"
            autoComplete="off"
            placeholder="Invitation code (optional)"
            error={errors["inviteCode"]}
          />
          <PillButton loading={submitting}>Register</PillButton>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-[17px] text-link underline underline-offset-4">
            Go to login &gt;
          </Link>
        </div>
      </div>
    </main>
  );
}
