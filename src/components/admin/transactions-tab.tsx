import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { formatStamp, ugx } from "@/lib/vanta";
import { AdminCard, AdminInput, AdminSelect, Empty } from "./ui";

type Row = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  amount: number;
  created_at: string;
  status: string;
  msisdn?: string | null;
};

export function TransactionsTab() {
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data: rows } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: async (): Promise<Row[]> => {
      const [ledger, recharges, withdrawals] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, user_id, kind, title, amount, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("recharges")
          .select("id, user_id, order_no, amount, status, msisdn, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("withdrawals")
          .select("id, user_id, order_no, amount, received, status, msisdn, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      if (ledger.error) throw ledger.error;

      const out: Row[] = (ledger.data ?? []).map((r) => ({ ...r, status: "Completed" }));

      for (const r of recharges.data ?? []) {
        out.push({
          id: `r-${r.id}`,
          user_id: r.user_id,
          kind: "recharge",
          title: `Deposit ${r.order_no}`,
          amount: r.amount,
          created_at: r.created_at,
          status: r.status,
          msisdn: r.msisdn,
        });
      }
      for (const w of withdrawals.data ?? []) {
        out.push({
          id: `w-${w.id}`,
          user_id: w.user_id,
          kind: "withdrawal",
          title: `Withdrawal ${w.order_no}`,
          amount: -Math.abs(w.amount),
          created_at: w.created_at,
          status: w.status,
          msisdn: w.msisdn,
        });
      }

      return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  });

  const { data: people } = useQuery({
    queryKey: ["admin", "user-index"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, phone, email, full_name").limit(1000);
      const map = new Map<string, string>();
      for (const row of data ?? []) {
        map.set(row.id, row.phone || row.email || row.full_name || row.id.slice(0, 8));
      }
      return map;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rows ?? []).filter((row) => {
      if (kind !== "all" && row.kind !== kind) return false;
      if (status !== "all" && bucket(row.status) !== status) return false;
      if (!term) return true;
      const who = people?.get(row.user_id) ?? "";
      return row.title.toLowerCase().includes(term) || who.toLowerCase().includes(term);
    });
  }, [rows, kind, status, search, people]);

  return (
    <div className="space-y-3">
      <AdminInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search member or title"
        aria-label="Search transactions"
      />
      <div className="grid grid-cols-2 gap-3">
        <AdminSelect value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="recharge">Recharge</option>
          <option value="withdrawal">Withdrawal</option>
        </AdminSelect>
        <AdminSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="success">Approved / success</option>
          <option value="failed">Failed / rejected</option>
        </AdminSelect>
      </div>

      {filtered.length === 0 ? (
        <Empty />
      ) : (
        filtered.map((row) => (
          <AdminCard key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{row.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {people?.get(row.user_id) ?? row.user_id.slice(0, 8)} · {row.kind}
                </p>
                {row.msisdn ? (
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">Number: {row.msisdn}</p>
                ) : null}
                <p className="mt-0.5 text-[12px] text-muted-foreground">{formatStamp(row.created_at)}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-[16px] font-bold ${row.amount < 0 ? "text-destructive" : "text-primary"}`}
                >
                  {row.amount < 0 ? "-" : "+"}
                  {ugx(row.amount)}
                </span>
                <p className={`mt-1 text-[12px] ${statusClass(row.status)}`}>{row.status}</p>
              </div>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}

function bucket(status: string) {
  const s = status.toLowerCase();
  if (s.includes("fail") || s.includes("reject") || s.includes("cancel")) return "failed";
  if (s.includes("progress") || s.includes("pending") || s.includes("processing")) return "pending";
  return "success";
}

function statusClass(status: string) {
  const b = bucket(status);
  if (b === "failed") return "text-destructive";
  if (b === "pending") return "text-muted-foreground";
  return "text-primary";
}
