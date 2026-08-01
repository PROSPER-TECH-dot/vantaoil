import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SkeletonBlock, EmptyState } from "@/components/vanta/ui";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Investment products — Vanta Oil" },
      { name: "description", content: "Browse Vanta Oil energy investment products." },
      { property: "og:title", content: "Investment products — Vanta Oil" },
      { property: "og:description", content: "Browse Vanta Oil energy investment products." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="slide-in">
      <PageHeader title="Products" subtitle="Curated energy investment plans" />
      <div className="space-y-4 px-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All plans", "Short term", "Balanced", "Long horizon"].map((label, index) => (
            <button
              key={label}
              type="button"
              className={`press shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${
                index === 0
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {[0, 1].map((i) => (
          <Panel key={i} className="md:transition-transform md:hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="h-5 w-14" />
            </div>
            <SkeletonBlock className="mt-3 h-3.5 w-full" />
            <SkeletonBlock className="mt-2 h-3.5 w-2/3" />
          </Panel>
        ))}

        <EmptyState
          title="Products launching soon"
          description="Investment plans are being finalised and will be listed here shortly."
        />
      </div>
    </div>
  );
}
