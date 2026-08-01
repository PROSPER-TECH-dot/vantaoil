import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import { formatStamp, ugx } from "@/lib/vanta";
import { AdminCard, AdminInput, AdminModal, AdminSelect, Empty, GhostButton, GoldButton, KV, Pill } from "./ui";

type Row = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  balance: number;
  recharge_balance: number;
  cumulative_income: number;
  withdrawn: number;
  products_count: number;
  invite_code: string | null;
  banned: boolean;
  created_at: string;
};

type Detail = {
  profile: Row & { checkin_days: number; referred_by: string | null };
  referrer: string | null;
  purchases: {
    id: string; name: string; price: number; daily: number; term: string; total: number; created_at: string;
  }[];
  transactions: { id: string; kind: string; title: string; amount: number; created_at: string }[];
  recharges: { id: string; order_no: string; amount: number; status: string; created_at: string }[];
  withdrawals: { id: string; order_no: string; amount: number; received: number; status: string; created_at: string }[];
  referrals: { id: string; phone: string | null; created_at: string; recharge: number }[];
  team_recharge: number;
  team_commission: number;
  is_admin: boolean;
};

function termDays(term: string) {
  const match = term.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function UsersTab() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, phone, email, balance, recharge_balance, cumulative_income, withdrawn, products_count, invite_code, banned, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      const term = search.trim();
      if (term) {
        query = query.or(
          `phone.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%,invite_code.ilike.%${term}%`,
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <div className="space-y-3">
      <AdminInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search phone, email, name or invite code"
        aria-label="Search users"
      />

      {!rows || rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((row) => (
          <AdminCard key={row.id}>
            <button type="button" onClick={() => setOpenId(row.id)} className="press w-full text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold">{row.phone || row.email || "—"}</p>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {row.full_name || "No name"} · Code {row.invite_code ?? "------"}
                  </p>
                </div>
                {row.banned ? <Pill tone="bad">Banned</Pill> : <Pill tone="good">Active</Pill>}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-semibold">{ugx(row.balance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recharge</p>
                  <p className="font-semibold">{ugx(row.recharge_balance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Products</p>
                  <p className="font-semibold">{row.products_count}</p>
                </div>
              </div>
            </button>
          </AdminCard>
        ))
      )}

      {openId ? <UserDetail userId={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const [wallet, setWallet] = useState("income");
  const [direction, setDirection] = useState("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_detail", { p_user_id: userId });
      if (error) throw error;
      return data as unknown as Detail;
    },
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const adjust = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!value || value <= 0) throw new Error("Enter an amount greater than zero");
      const { error } = await supabase.rpc("admin_adjust_balance", {
        p_user_id: userId,
        p_wallet: wallet,
        p_direction: direction,
        p_amount: value,
        p_note: note.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setAmount("");
      setNote("");
      await refresh();
      showCenterToast("Balance updated");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  const toggleBan = useMutation({
    mutationFn: async (banned: boolean) => {
      const { error } = await supabase.rpc("admin_set_banned", { p_user_id: userId, p_banned: banned });
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      showCenterToast("Account status updated");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      const email = data?.profile.email;
      if (!email) throw new Error("This account has no email address");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
    },
    onSuccess: () => showCenterToast("Reset link sent"),
    onError: (error: Error) => showPillToast(error.message),
  });

  const p = data?.profile;

  return (
    <AdminModal title={p?.phone || "Member"} onClose={onClose}>
      {!data ? (
        <Empty label="Loading…" />
      ) : (
        <div className="space-y-5">
          <section>
            <KV label="Name" value={p?.full_name || "—"} />
            <KV label="Email" value={p?.email || "—"} />
            <KV label="Invite code" value={p?.invite_code ?? "------"} />
            <KV label="Invited by" value={data.referrer || "—"} />
            <KV label="Joined" value={p ? formatStamp(p.created_at) : "—"} />
            <KV label="Status" value={p?.banned ? <Pill tone="bad">Banned</Pill> : <Pill tone="good">Active</Pill>} />
          </section>

          <section>
            <h3 className="mb-1 text-[15px] font-bold">Wallet</h3>
            <KV label="Account balance" value={ugx(p?.balance ?? 0)} />
            <KV label="Recharge balance" value={ugx(p?.recharge_balance ?? 0)} />
            <KV label="Cumulative income" value={ugx(p?.cumulative_income ?? 0)} />
            <KV label="Withdrawn" value={ugx(p?.withdrawn ?? 0)} />
            <KV label="Check-in days" value={String(p?.checkin_days ?? 0)} />
          </section>

          <section>
            <h3 className="mb-1 text-[15px] font-bold">Team</h3>
            <KV label="Referrals" value={String(data.referrals.length)} />
            <KV label="Team recharge" value={ugx(data.team_recharge)} />
            <KV label="Commission earned" value={ugx(data.team_commission)} />
            {data.referrals.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-1.5 text-[13px]">
                <span className="truncate text-muted-foreground">{r.phone || "—"}</span>
                <span>{ugx(r.recharge)}</span>
              </div>
            ))}
          </section>

          <section>
            <h3 className="mb-1 text-[15px] font-bold">Purchased products</h3>
            {data.purchases.length === 0 ? (
              <Empty />
            ) : (
              data.purchases.map((pu) => {
                const days = termDays(pu.term);
                const elapsed = Math.max(
                  0,
                  Math.floor((Date.now() - new Date(pu.created_at).getTime()) / 86_400_000),
                );
                const run = Math.min(elapsed, days);
                return (
                  <AdminCard key={pu.id} className="mt-2 bg-surface">
                    <p className="text-[15px] font-semibold">{pu.name}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Bought {formatStamp(pu.created_at)}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
                      <span className="text-muted-foreground">Price</span>
                      <span className="text-right font-semibold">{ugx(pu.price)}</span>
                      <span className="text-muted-foreground">Earned so far</span>
                      <span className="text-right font-semibold">{ugx(run * pu.daily)}</span>
                      <span className="text-muted-foreground">Days remaining</span>
                      <span className="text-right font-semibold">{Math.max(days - run, 0)} / {days}</span>
                    </div>
                  </AdminCard>
                );
              })
            )}
          </section>

          <section>
            <h3 className="mb-1 text-[15px] font-bold">Adjust balance</h3>
            <div className="grid grid-cols-2 gap-3">
              <AdminSelect label="Wallet" value={wallet} onChange={(e) => setWallet(e.target.value)}>
                <option value="income">Income balance</option>
                <option value="recharge">Recharge balance</option>
              </AdminSelect>
              <AdminSelect label="Action" value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </AdminSelect>
            </div>
            <div className="mt-3 space-y-3">
              <AdminInput
                label="Amount (UGX)"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
              />
              <AdminInput
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason shown in the member's records"
              />
              <GoldButton className="w-full" disabled={adjust.isPending} onClick={() => adjust.mutate()}>
                {direction === "debit" ? "Debit account" : "Credit account"}
              </GoldButton>
            </div>
          </section>

          <section className="flex flex-wrap gap-2">
            <GhostButton disabled={toggleBan.isPending} onClick={() => toggleBan.mutate(!p?.banned)}>
              {p?.banned ? "Unban account" : "Ban account"}
            </GhostButton>
            <GhostButton disabled={resetPassword.isPending} onClick={() => resetPassword.mutate()}>
              Reset password
            </GhostButton>
          </section>

          <section>
            <h3 className="mb-1 text-[15px] font-bold">Transaction history</h3>
            {data.transactions.length === 0 ? (
              <Empty />
            ) : (
              data.transactions.slice(0, 50).map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3 border-b border-border py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px]">{t.title}</p>
                    <p className="text-[12px] text-muted-foreground">{formatStamp(t.created_at)}</p>
                  </div>
                  <span className={`text-[14px] font-semibold ${t.amount < 0 ? "text-destructive" : "text-primary"}`}>
                    {t.amount < 0 ? "-" : "+"}
                    {ugx(t.amount)}
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </AdminModal>
  );
}
