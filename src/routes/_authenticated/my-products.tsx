import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/my-products")({
  head: () => ({
    meta: [
      { title: "My Products — Vanta Oil" },
      { name: "description", content: "Track the Vanta Oil products you own and the revenue they generate." },
      { property: "og:title", content: "My Products — Vanta Oil" },
      {
        property: "og:description",
        content: "Track the Vanta Oil products you own and the revenue they generate.",
      },
    ],
  }),
  component: MyProductsPage,
});

function MyProductsPage() {
  const router = useRouter();

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <header className="flex items-center gap-3 bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Go back"
          className="press -ml-1 p-1"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold">My Products</h1>
      </header>

      <div className="border-b border-border bg-background px-5 pb-4 text-center">
        <p className="flex items-center justify-center gap-2 text-[16px] font-medium">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
          </svg>
          Product income is settled every 24 hours
        </p>
        <p className="mt-2 text-[15px] text-muted-foreground">
          You can purchase multiple devices to increase your income
        </p>
      </div>

      <section className="px-4 pt-4">
        <div
          className="overflow-hidden rounded-3xl px-6 py-7"
          style={{ background: "var(--gradient-charcoal)" }}
        >
          <div className="flex items-end justify-between text-charcoal-foreground">
            <div>
              <p className="text-3xl font-bold">0</p>
              <p className="mt-1 text-[15px] opacity-90">My Product</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">UGX 0</p>
              <p className="mt-1 text-[15px] opacity-90">Total revenue</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <svg viewBox="0 0 24 24" width="76" height="76" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-border" aria-hidden="true">
          <path d="M6 3h7l5 5v13H6z" strokeLinejoin="round" />
          <path d="M13 3v5h5" strokeLinejoin="round" />
          <path d="M9 12h6M9 15.5h6" strokeLinecap="round" />
        </svg>
        <p className="mt-4 text-[17px] text-muted-foreground">No products yet</p>
      </div>
    </div>
  );
}
