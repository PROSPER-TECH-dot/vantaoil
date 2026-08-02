import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { formatStamp, productImage, ugx } from "@/lib/vanta";

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

function useTick() {
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
}

function countdown(next: string | null) {
  if (!next) return "—";
  const ms = new Date(next).getTime() - Date.now();
  if (ms <= 0) return "Settling…";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function MyProductsPage() {
  const router = useRouter();
  useTick();
  const { data: rows } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, name, image, price, daily, term, total, created_at, term_days, days_paid, next_payout_at, frozen")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const items = rows ?? [];
  const revenue = items.reduce((sum, row) => sum + Number(row.daily ?? 0) * Number(row.days_paid ?? 0), 0);



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
              <p className="text-3xl font-bold">{items.length}</p>
              <p className="mt-1 text-[15px] opacity-90">My Product</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{ugx(revenue)}</p>
              <p className="mt-1 text-[15px] opacity-90">Total revenue</p>
            </div>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <svg viewBox="0 0 24 24" width="76" height="76" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-border" aria-hidden="true">
            <path d="M6 3h7l5 5v13H6z" strokeLinejoin="round" />
            <path d="M13 3v5h5" strokeLinejoin="round" />
            <path d="M9 12h6M9 15.5h6" strokeLinecap="round" />
          </svg>
          <p className="mt-4 text-[17px] text-muted-foreground">No products yet</p>
        </div>
      ) : (
        <section className="space-y-3 px-4 py-4">
          {items.map((row) => {
            const days = Number(row.term_days ?? 0);
            const paid = Number(row.days_paid ?? 0);
            return (
              <article key={row.id} className="flex gap-3 rounded-2xl bg-background p-4">
                <img
                  src={productImage(row.image)}
                  alt={row.name}
                  width={120}
                  height={90}
                  loading="lazy"
                  className="h-20 w-24 shrink-0 rounded-xl object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{row.name}</p>
                  <p className="mt-1 text-[14px] text-muted-foreground">Term: {row.term}</p>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    Daily income: {ugx(Number(row.daily))}
                  </p>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    Earned so far: <span className="font-semibold text-primary">{ugx(paid * Number(row.daily))}</span>
                  </p>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    Days remaining: {Math.max(days - paid, 0)} / {days}
                  </p>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {row.frozen
                      ? "Frozen — income paused"
                      : days - paid <= 0
                        ? "Completed"
                        : `Next income in ${countdown(row.next_payout_at)}`}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{formatStamp(row.created_at)}</p>
                </div>
                <p className="shrink-0 text-[16px] font-bold text-primary">{ugx(Number(row.price))}</p>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
