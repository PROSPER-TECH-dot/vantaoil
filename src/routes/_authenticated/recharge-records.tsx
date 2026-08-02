import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SubHeader } from "@/components/vanta/sub-header";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId, formatStamp, ugx } from "@/lib/vanta";

export const Route = createFileRoute("/_authenticated/recharge-records")({
  head: () => ({
    meta: [
      { title: "Recharge Records — Vanta Oil" },
      { name: "description", content: "Track every Vanta Oil recharge order, its amount and its current status." },
      { property: "og:title", content: "Recharge Records — Vanta Oil" },
      { property: "og:description", content: "Track every Vanta Oil recharge order, its amount and its current status." },
    ],
  }),
  component: RechargeRecordsPage,
});

function RechargeRecordsPage() {
  const { data: rows } = useQuery({
    queryKey: ["recharges"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data } = await supabase
        .from("recharges")
        .select("id, order_no, amount, status, msisdn, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Recharge Records" />

      {!rows || rows.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-muted-foreground">No more data</p>
      ) : (
        <section className="px-5">
          {rows.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-4 border-b border-border py-5">
              <div className="min-w-0">
                <p className="truncate text-[16px]">{row.order_no}</p>
                {row.msisdn ? (
                  <p className="truncate text-[13px] text-muted-foreground">{row.msisdn}</p>
                ) : null}
                <p className="mt-2 text-[14px] text-muted-foreground">{formatStamp(row.created_at)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[16px] font-bold">{ugx(row.amount)}</p>
                <p className="mt-2 text-[14px] text-primary">{row.status}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
