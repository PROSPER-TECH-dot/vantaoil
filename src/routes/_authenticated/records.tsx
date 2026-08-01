import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SubHeader } from "@/components/vanta/sub-header";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: "Balance Details — Vanta Oil" },
      { name: "description", content: "Review your Vanta Oil income records and withdrawal records in one place." },
      { property: "og:title", content: "Balance Details — Vanta Oil" },
      { property: "og:description", content: "Review your Vanta Oil income records and withdrawal records in one place." },
    ],
  }),
  component: RecordsPage,
});

type Entry = { id: string; label: string; date: string; amount: number };

const income: Entry[] = [];
const withdrawals: Entry[] = [];

const ugx = (value: number) => `UGX ${Math.abs(value).toLocaleString("en-US")}`;

function RecordsPage() {
  const [tab, setTab] = useState<"income" | "withdrawal">("income");
  const rows = tab === "income" ? income : withdrawals;

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Balance Details" />

      <div className="grid grid-cols-2 px-4">
        {(["income", "withdrawal"] as const).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`press border border-border py-3 text-[15px] ${
                active ? "bg-primary font-bold text-primary-foreground" : "bg-background text-muted-foreground"
              }`}
            >
              {key === "income" ? "Income Records" : "Withdrawal Records"}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-muted-foreground">No more data</p>
      ) : (
        <section className="space-y-3 px-4 py-4">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{row.label}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{row.date}</p>
              </div>
              <p
                className={`shrink-0 text-[16px] font-bold ${
                  row.amount >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {row.amount >= 0 ? "+" : "-"}
                {ugx(row.amount)}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
