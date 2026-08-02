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
  avatar_url: string | null;
  balance: number;
  recharge_balance: number;
  cumulative_income: number;
  withdrawn: number;
  products_count: number;
  invite_code: string | null;
  banned: boolean;
  created_at: string;
};

type Referral = { id: string; phone: string | null; avatar_url: string | null; created_at: string; recharge: number };

type Detail = {
  profile: Row & { checkin_days: number; referred_by: string | null; email: string | null };
  referrer: string | null;
  purchases: {
    id: string; name: string; price: number; daily: number; term: string; total: number; created_at: string;
    term_days: number; days_paid: number; frozen: boolean; next_payout_at: string | null;
  }[];
  transactions: { id: string; kind: string; title: string; amount: number; created_at: string }[];
  recharges: { id: string; order_no: string; amount: number; status: string; created_at: string }[];
  withdrawals: { id: string; order_no: string; amount: number; received: number; status: string; created_at: string }[];
  referrals: Referral[];
  referrals_l2: Referral[];
  referrals_l3: Referral[];
  recharge_l1: number;
  recharge_l2: number;
  recharge_l3: number;
  commission_l1: number;
  commission_l2: number;
  commission_l3: number;
  team_recharge: number;
  team_commission: number;
  is_admin: boolean;
};

function termDays(term: string) {
  const match = term.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["admin", "avatar", path],
    enabled: Boolean(path),
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const value = path as string;
      if (/^https?:\/\//.test(value)) return value;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(value, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });
}

function Avatar({
  url,
  label,
  size = 40,
  onView,
}: {
  url: string | null | undefined;
  label: string | null;
  size?: number;
  onView?: (src: string) => void;
}) {
  const { data: src } = useAvatarUrl(url);
  if (src) {
    return (
      <img
        src={src}
        alt={label ? `${label} profile picture` : "Member profile picture"}
        width={size}
        height={size}
        loading="lazy"
        onClick={onView ? (e) => { e.stopPropagation(); onView(src); } : undefined}
        style={{ width: size, height: size }}
        className="press shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-semibold text-muted-foreground"
    >
      {(label ?? "?").replace(/\D/g, "").slice(-2) || "?"}
    </span>
  );
}

function AvatarViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Profile picture"
      onClick={onClose}
      className="fixed inset-0 z-[80] grid place-items-center bg-night/90 p-6"
    >
      <img src={src} alt="Member profile picture in full view" className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain" />
    </div>
  );
}


export function UsersTab() {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewSrc, setViewSrc] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, phone, avatar_url, balance, recharge_balance, cumulative_income, withdrawn, products_count, invite_code, banned, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      const term = search.trim();
      if (term) {
        query = query.or(`phone.ilike.%${term}%,invite_code.ilike.%${term}%`);
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
        placeholder="Search phone number or invite code"
        aria-label="Search users"
      />

      {!rows || rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((row) => (
          <AdminCard key={row.id}>
            <div className="flex items-start gap-3">
              <Avatar url={row.avatar_url} label={row.phone} onView={setViewSrc} />
              <button type="button" onClick={() => setOpenId(row.id)} className="press min-w-0 flex-1 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold">{row.phone || "—"}</p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      Code {row.invite_code ?? "------"}
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
            </div>
          </AdminCard>
        ))
      )}

      {openId ? <UserDetail userId={openId} onClose={() => setOpenId(null)} /> : null}
      {viewSrc ? <AvatarViewer src={viewSrc} onClose={() => setViewSrc(null)} /> : null}
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
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [viewSrc, setViewSrc] = useState<string | null>(null);

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
        p_note: note.trim(),
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
            <div className="mb-2 flex items-center gap-3">
              <Avatar url={p?.avatar_url} label={p?.phone ?? null} size={56} onView={setViewSrc} />
              <p className="text-[15px] font-semibold">{p?.phone || "—"}</p>
            </div>
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
            <h3 className="mb-2 text-[15px] font-bold">Team</h3>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className={`press rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                    level === lv ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
                  }`}
                >
                  Level {lv}
                </button>
              ))}
            </div>
            {(() => {
              const list =
                level === 1 ? data.referrals ?? [] : level === 2 ? data.referrals_l2 ?? [] : data.referrals_l3 ?? [];
              const recharge =
                level === 1 ? data.recharge_l1 : level === 2 ? data.recharge_l2 : data.recharge_l3;
              const commission =
                level === 1 ? data.commission_l1 : level === 2 ? data.commission_l2 : data.commission_l3;
              return (
                <div className="mt-3">
                  <KV label={`Level ${level} members`} value={String(list.length)} />
                  <KV label={`Level ${level} team recharge`} value={ugx(recharge ?? 0)} />
                  <KV label={`Commission from level ${level}`} value={ugx(commission ?? 0)} />
                  {list.length === 0 ? (
                    <Empty />
                  ) : (
                    list.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 border-b border-border py-2 text-[13px]">
                        <Avatar url={r.avatar_url} label={r.phone} size={28} onView={setViewSrc} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{r.phone || "—"}</p>
                          <p className="text-[12px] text-muted-foreground">{formatStamp(r.created_at)}</p>
                        </div>
                        <span className="shrink-0 font-semibold">{ugx(r.recharge)}</span>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
            <div className="mt-3">
              <KV label="Total team recharge" value={ugx(data.team_recharge)} />
              <KV label="Total received from invites" value={ugx(data.team_commission)} />
            </div>
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

          {viewSrc ? <AvatarViewer src={viewSrc} onClose={() => setViewSrc(null)} /> : null}
        </div>
      )}
    </AdminModal>
  );
}
