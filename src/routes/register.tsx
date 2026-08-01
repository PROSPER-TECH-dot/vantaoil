import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field, SubmitButton } from "@/components/vanta/field";
import { useLoading } from "@/components/vanta/loading";
import heroImage from "@/assets/oil-hero.jpg";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your Vanta Oil account" },
      {
        name: "description",
        content:
          "Open a Vanta Oil account in under a minute and start building a disciplined energy portfolio.",
      },
      { property: "og:title", content: "Create your Vanta Oil account" },
      {
        property: "og:description",
        content: "Open a Vanta Oil account and start building a disciplined energy portfolio.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email address").max(255),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20)
      .regex(/^[+0-9 ()-]+$/, "Enter a valid phone number"),
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirmPassword: z.string(),
    terms: z.literal(true, { message: "Please accept the Terms & Privacy Policy" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Errors = Partial<Record<string, string>>;

function RegisterPage() {
  const navigate = useNavigate();
  const { startLoading } = useLoading();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [terms, setTerms] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      terms,
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please check the highlighted fields");
      return;
    }

    setErrors({});
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      toast.success("Account created", {
        description: "Check your inbox to confirm your email address, then sign in.",
      });
      navigate({ to: "/login" });
      return;
    }

    toast.success("Account created successfully", {
      description: "Welcome to Vanta Oil.",
    });
    startLoading(1800);
    navigate({ to: "/home" });
  }

  return (
    <AuthShell
      eyebrow="Vanta Oil"
      title="Create your account"
      description="Join a platform built for long-term energy investors."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <img
        src={heroImage}
        alt="Black oil droplet on a stone podium next to a rising gold chart"
        width={1024}
        height={768}
        className="mb-5 h-36 w-full rounded-2xl object-cover"
      />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Amara Bennett"
          error={errors["fullName"]}
        />
        <Field
          label="Email address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors["email"]}
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 018 2274"
          error={errors["phone"]}
        />
        <Field
          label="Password"
          name="password"
          toggleable
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors["password"]}
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          toggleable
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors["confirmPassword"]}
        />

        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded-md accent-[oklch(0.71_0.113_92.3)]"
          />
          <span>
            I agree to the <span className="font-semibold text-foreground">Terms of Service</span>{" "}
            and <span className="font-semibold text-foreground">Privacy Policy</span>.
          </span>
        </label>
        {errors["terms"] ? (
          <p className="text-[12.5px] font-medium text-destructive">{errors["terms"]}</p>
        ) : null}

        <SubmitButton loading={submitting}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}
