import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { PillInput, PasswordInput, PillButton } from "@/components/vanta/auth-ui";
import { useLoading } from "@/components/vanta/loading";
import { useCenterToast } from "@/components/vanta/center-toast";
import { phoneToEmail } from "@/lib/phone";
import { setupAccount } from "@/lib/vanta";
import authImage from "@/assets/oil-login.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Vanta Oil" },
      {
        name: "description",
        content: "Log in to your Vanta Oil account with your phone number and password.",
      },
      { property: "og:title", content: "Log in — Vanta Oil" },
      {
        property: "og:description",
        content: "Log in to your Vanta Oil account with your phone number and password.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  phone: z.string().trim().min(6, "Enter your phone number").max(15),
  password: z.string().min(1, "Enter your password").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { startLoading } = useLoading();
  const { showCenterToast, showPillToast } = useCenterToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
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
    const { data: signIn, error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(parsed.data.phone),
      password: parsed.data.password,
    });

    if (error) {
      setSubmitting(false);
      showPillToast(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("banned")
      .eq("id", signIn.user?.id ?? "")
      .maybeSingle();

    if (profile?.banned) {
      await supabase.auth.signOut();
      setSubmitting(false);
      showPillToast("Your account has been suspended. Contact customer service.");
      return;
    }

    setSubmitting(false);

    await setupAccount(`+256${parsed.data.phone.replace(/\D/g, "").replace(/^0+/, "")}`);
    showCenterToast("Login successful");
    startLoading(1500);
    setTimeout(() => navigate({ to: "/home" }), 1500);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-night text-night-foreground">
      <img
        src={authImage}
        alt="Offshore oil drilling platform at dusk"
        width={1024}
        height={1024}
        className="pointer-events-none absolute inset-x-0 top-0 h-[62vh] w-full object-cover opacity-90"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[62vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--night) 55%, transparent) 0%, transparent 30%, color-mix(in oklab, var(--night) 92%, transparent) 82%, var(--night) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-8 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <h1 className="text-center text-[2.6rem] leading-none font-normal">Log in</h1>

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
            autoComplete="current-password"
            placeholder="Enter password"
            error={errors["password"]}
          />
          <PillButton loading={submitting}>Log in</PillButton>
        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-[17px] text-link underline underline-offset-4">
            Go to register &gt;
          </Link>
        </div>
      </div>
    </main>
  );
}
