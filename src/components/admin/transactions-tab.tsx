import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { formatStamp, ugx } from "@/lib/vanta";
import { AdminCard, AdminInput, AdminSelect, Empty } from "./ui";

type Txn = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  amount: number;
  created_at: string;
};

export function TransactionsTab() {
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");

  const { data: rows } = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, user_id, kind, title, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Txn[];
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
      if (!term) return true;
      const who = people?.get(row.user_id) ?? "";
      return row.title.toLowerCase().includes(term) || who.toLowerCase().includes(term);
    });
  }, [rows, kind, search, people]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <AdminInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member or title"
          aria-label="Search transactions"
        />
        <AdminSelect value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="recharge">Recharge</option>
          <option value="withdrawal">Withdrawal</option>
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
                <p className="mt-0.5 text-[12px] text-muted-foreground">{formatStamp(row.created_at)}</p>
              </div>
              <span
                className={`shrink-0 text-[16px] font-bold ${row.amount < 0 ? "text-destructive" : "text-primary"}`}
              >
                {row.amount < 0 ? "-" : "+"}
                {ugx(row.amount)}
              </span>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}
