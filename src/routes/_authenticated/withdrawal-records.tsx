import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SubHeader } from "@/components/vanta/sub-header";
import { supabase } from "@/integrations/supabase/client";
import { formatStamp, ugx } from "@/lib/vanta";

export const Route = createFileRoute("/_authenticated/withdrawal-records")({
  head: () => ({
    meta: [
      { title: "Withdrawal Records — Vanta Oil" },
      { name: "description", content: "See every Vanta Oil withdrawal, the amount received and its current status." },
      { property: "og:title", content: "Withdrawal Records — Vanta Oil" },
      { property: "og:description", content: "See every Vanta Oil withdrawal, the amount received and its current status." },
    ],
  }),
  component: WithdrawalRecordsPage,
});

function WithdrawalRecordsPage() {
  const { data: rows } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("id, order_no, amount, received, status, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Withdrawal Records" />

      {!rows || rows.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-muted-foreground">No more data</p>
      ) : (
        <section className="px-5">
          {rows.map((row) => (
            <div key={row.id} className="border-b border-border py-5">
              <div className="flex items-center justify-between gap-4">
                <p className="min-w-0 truncate text-[16px]">{row.order_no}</p>
                <p
                  className={`shrink-0 text-[15px] font-semibold ${
                    row.status === "Successful" ? "text-success" : "text-primary"
                  }`}
                >
                  {row.status}
                </p>
              </div>
              <div className="mt-3 space-y-2 text-[15px] text-muted-foreground">
                <Row label="Amount" value={ugx(row.amount)} />
                <Row label="Received" value={ugx(row.received)} />
                <Row label="Date" value={formatStamp(row.created_at)} />
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0">{label}</span>
      <span>: {value}</span>
    </div>
  );
}
