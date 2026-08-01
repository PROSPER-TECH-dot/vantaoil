import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SkeletonBlock, EmptyState } from "@/components/vanta/ui";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vanta Oil" },
      { name: "description", content: "Your Vanta Oil dashboard overview." },
      { property: "og:title", content: "Dashboard — Vanta Oil" },
      { property: "og:description", content: "Your Vanta Oil dashboard overview." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="slide-in">
      <PageHeader
        title="Dashboard"
        subtitle="Your portfolio at a glance"
        action={
          <button
            type="button"
            aria-label="Notifications"
            className="press grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
              <path d="M10 18.5a2 2 0 0 0 4 0" />
            </svg>
          </button>
        }
      />

      <div className="space-y-4 px-5">
        <section
          className="rounded-3xl p-5 text-charcoal-foreground"
          style={{ background: "var(--gradient-charcoal)", boxShadow: "var(--shadow-card)" }}
        >
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-60">
            Total balance
          </p>
          <div className="mt-3 space-y-2">
            <SkeletonBlock className="h-8 w-40 bg-white/10" />
            <SkeletonBlock className="h-4 w-28 bg-white/10" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Panel title="Invested">
            <SkeletonBlock className="h-6 w-20" />
          </Panel>
          <Panel title="Earnings">
            <SkeletonBlock className="h-6 w-20" />
          </Panel>
        </div>

        <Panel title="Recent activity">
          <EmptyState
            title="No activity yet"
            description="Your deposits, returns and portfolio updates will appear here."
          />
        </Panel>
      </div>
    </div>
  );
}
