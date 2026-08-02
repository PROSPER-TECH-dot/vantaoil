import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import { approveWithdrawal, rejectWithdrawal } from "@/lib/payments.functions";
import { formatStamp, ugx } from "@/lib/vanta";
import { AdminCard, AdminSelect, Empty, GoldButton } from "./ui";

type Row = {
  id: string;
  user_id: string;
  order_no: string;
  amount: number;
  received: number;
  status: string;
  msisdn: string | null;
  created_at: string;
};

export function WithdrawalsTab() {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const approve = useServerFn(approveWithdrawal);
  const reject = useServerFn(rejectWithdrawal);
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, user_id, order_no, amount, received, status, msisdn, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: people } = useQuery({
    queryKey: ["admin", "user-index"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, phone, full_name").limit(1000);
      const map = new Map<string, string>();
      for (const row of data ?? []) map.set(row.id, row.phone || row.full_name || row.id.slice(0, 8));
      return map;
    },
  });

  const filtered = useMemo(
    () => (rows ?? []).filter((row) => status === "all" || bucket(row.status) === status),
    [rows, status],
  );

  async function run(kind: "approve" | "reject", row: Row) {
    setBusy(row.id);
    try {
      if (kind === "approve") {
        await approve({ data: { id: row.id } });
        showCenterToast("Withdrawal approved");
      } else {
        await reject({ data: { id: row.id } });
        showCenterToast("Withdrawal declined and refunded");
      }
      await queryClient.invalidateQueries();
    } catch (error) {
      showPillToast(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <AdminSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter withdrawals">
        <option value="pending">Pending approval</option>
        <option value="success">Approved</option>
        <option value="failed">Declined</option>
        <option value="all">All</option>
      </AdminSelect>

      {filtered.length === 0 ? (
        <Empty />
      ) : (
        filtered.map((row) => (
          <AdminCard key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{row.order_no}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {people?.get(row.user_id) ?? row.user_id.slice(0, 8)}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  Paid to: {row.msisdn || "—"}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{formatStamp(row.created_at)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[16px] font-bold">{ugx(row.amount)}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Receives {ugx(row.received)}</p>
                <p className="mt-1 text-[12px]">{row.status}</p>
              </div>
            </div>

            {bucket(row.status) === "pending" ? (
              <div className="mt-3 flex gap-2">
                <GoldButton className="flex-1" disabled={busy === row.id} onClick={() => run("approve", row)}>
                  Approve
                </GoldButton>
                <button
                  type="button"
                  disabled={busy === row.id}
                  onClick={() => run("reject", row)}
                  className="press flex-1 rounded-xl border border-destructive/50 py-2 text-[14px] font-semibold text-destructive disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            ) : null}
          </AdminCard>
        ))
      )}
    </div>
  );
}

function bucket(status: string) {
  const s = status.toLowerCase();
  if (s.includes("reject") || s.includes("fail") || s.includes("declin") || s.includes("cancel")) return "failed";
  if (s.includes("success") || s.includes("complete") || s.includes("approve") || s.includes("paid")) return "success";
  return "pending";
}
