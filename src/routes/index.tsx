import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/oil-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vanta Oil — Premium Oil Investment Platform" },
      {
        name: "description",
        content:
          "Vanta Oil is a premium mobile-first platform for investing in energy and oil assets with clarity, security and control.",
      },
      { property: "og:title", content: "Vanta Oil — Premium Oil Investment Platform" },
      {
        property: "og:description",
        content: "Invest in energy assets with a platform built for clarity, security and control.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-charcoal text-charcoal-foreground">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M12 3c3 4 5 6.6 5 9a5 5 0 0 1-10 0c0-2.4 2-5 5-9Z" />
          </svg>
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">Vanta Oil</span>
      </div>

      <div className="fade-up mt-8">
        <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          Energy · Wealth · Discipline
        </p>
        <h1 className="mt-4 text-[2.1rem] leading-[1.1] font-bold">
          Invest in oil with <span className="gold-text">institutional</span> confidence.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          A refined platform for building and tracking your energy portfolio — secure accounts,
          transparent products and a calm, focused experience on every device.
        </p>
      </div>

      <img
        src={heroImage}
        alt="Polished black oil droplet on a stone platform beside a rising gold performance chart"
        width={1024}
        height={768}
        className="mt-7 w-full rounded-3xl object-cover"
        style={{ boxShadow: "var(--shadow-card)" }}
      />

      <div className="mt-auto pt-8">
        <Link
          to="/register"
          className="press flex h-13 w-full items-center justify-center rounded-2xl py-4 text-[15px] font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          Create your account
        </Link>
        <Link
          to="/login"
          className="press mt-3 flex w-full items-center justify-center rounded-2xl border border-border bg-card py-4 text-[15px] font-semibold"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
