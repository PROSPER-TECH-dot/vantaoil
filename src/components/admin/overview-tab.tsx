import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { ugx } from "@/lib/vanta";
import { Stat } from "./ui";

type Overview = {
  total_users: number;
  joined_today: number;
  joined_yesterday: number;
  banned_users: number;
  deposit_total: number;
  deposit_count: number;
  deposit_pending: number;
  withdraw_total: number;
  withdraw_count: number;
  withdraw_pending: number;
  products_sold: number;
  sales_total: number;
  open_problems: number;
};

export function OverviewTab() {
  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  const n = (v: number | undefined) => (v ?? 0).toLocaleString("en-US");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 text-[15px] font-bold">Members</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total users" value={n(data?.total_users)} />
          <Stat label="Banned users" value={n(data?.banned_users)} />
          <Stat label="Joined today" value={n(data?.joined_today)} />
          <Stat label="Joined yesterday" value={n(data?.joined_yesterday)} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-[15px] font-bold">Deposits</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Successful deposits"
            value={ugx(data?.deposit_total ?? 0)}
            hint={`${n(data?.deposit_count)} orders`}
          />
          <Stat label="Pending deposits" value={n(data?.deposit_pending)} hint="Awaiting review" />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-[15px] font-bold">Withdrawals</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Successful withdrawals"
            value={ugx(data?.withdraw_total ?? 0)}
            hint={`${n(data?.withdraw_count)} orders`}
          />
          <Stat label="Pending withdrawals" value={n(data?.withdraw_pending)} hint="Awaiting review" />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-[15px] font-bold">Platform</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Products sold" value={n(data?.products_sold)} />
          <Stat label="Product sales" value={ugx(data?.sales_total ?? 0)} />
          <Stat label="Open recharge problems" value={n(data?.open_problems)} />
        </div>
      </div>
    </div>
  );
}
