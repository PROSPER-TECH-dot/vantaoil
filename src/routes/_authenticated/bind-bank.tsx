import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { ConfirmButton, LineInput, StarLabel, SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/bind-bank")({
  validateSearch: (search: Record<string, unknown>) => ({
    select: search['select'] === true || search['select'] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Bank Account List — Vanta Oil" },
      { name: "description", content: "Manage and bind your MTN or Airtel mobile money accounts to withdraw Vanta Oil earnings." },
      { property: "og:title", content: "Bank Account List — Vanta Oil" },
      { property: "og:description", content: "Manage and bind your MTN or Airtel mobile money accounts to withdraw Vanta Oil earnings." },
    ],
  }),
  component: BindBankPage,
});


const BANKS = ["MTN", "Airtel"];
const ITEM_H = 44;

type Account = { id: string; bank: string; holder: string; account: string };

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, bank, holder, account")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

function BindBankPage() {
  const [view, setView] = useState<"list" | "form">("list");
  const { data: accounts } = useBankAccounts();
  const queryClient = useQueryClient();
  const { showPillToast } = useCenterToast();
  const { select } = Route.useSearch();
  const navigate = useNavigate();

  async function remove(id: string) {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) return showPillToast(error.message);
    await queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
    showPillToast("Bank account removed");
  }

  if (view === "form") {
    return <BindForm onCancel={() => setView("list")} onSaved={() => setView("list")} />;
  }

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Bank Account List" />

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => setView("form")}
          className="press mx-auto block w-[62%] rounded-full py-3 text-[17px] font-bold text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          Add
        </button>
      </div>


      <section className="space-y-3 px-4 py-6">
        {(accounts ?? []).map((a) => (
          <div
            key={a.id}
            onClick={select ? () => navigate({ to: "/withdraw", search: { card: a.id } }) : undefined}
            className={`rounded-2xl bg-background px-4 py-4 ${select ? "press cursor-pointer" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">{a.bank}</p>
                <p className="mt-1 text-[14px] text-muted-foreground">{a.holder}</p>
                <p className="mt-0.5 text-[14px] text-muted-foreground">{a.account}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void remove(a.id);
                }}
                className="press shrink-0 text-[14px] text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>

    </div>
  );
}

function BindForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const { showPillToast } = useCenterToast();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, setPending] = useState("MTN");
  const [bank, setBank] = useState("");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!bank) return showPillToast("Please select a bank");
    if (!holder.trim()) return showPillToast("Please enter account holder name");
    if (!/^\d{6,15}$/.test(account.trim())) return showPillToast("Please enter a valid bank account number");
    if (busy) return;
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return showPillToast("Please sign in again");
      const { error } = await supabase.from("bank_accounts").insert({
        user_id: uid,
        bank,
        holder: holder.trim(),
        account: account.trim(),
      });
      if (error) return showPillToast(error.message);
      await queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
      showPillToast("Bank card bound successfully");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Bind Bank Card" />

      <form onSubmit={submit} className="px-4 pt-4">
        <div className="rounded-3xl bg-background px-5 py-7">
          <StarLabel>Select Bank</StarLabel>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="press mt-3 w-full border-b border-border pb-2.5 text-left text-[15px]"
          >
            <span className={bank ? "" : "text-muted-foreground/80"}>{bank || "Please select"}</span>
          </button>

          <div className="mt-8">
            <StarLabel>Account Holder Name</StarLabel>
            <LineInput
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              maxLength={80}
              placeholder="Please enter account holder name"
            />
          </div>

          <div className="mt-8">
            <StarLabel>Bank Account</StarLabel>
            <LineInput
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              inputMode="numeric"
              maxLength={20}
              placeholder="Please enter bank account number"
            />
          </div>
        </div>

        <div className="space-y-3 py-6">
          <ConfirmButton>Confirm</ConfirmButton>
          <button
            type="button"
            onClick={onCancel}
            className="press mx-auto block w-[62%] rounded-full bg-secondary py-3 text-[16px] font-semibold text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      </form>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="flex-1"
            style={{ backgroundColor: "color-mix(in oklab, var(--night) 55%, transparent)" }}
          />
          <div className="mx-auto w-full max-w-md bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <button type="button" onClick={() => setSheetOpen(false)} className="press text-[16px] text-link">
                Cancel
              </button>
              <p className="text-[16px] font-bold">Select Bank</p>
              <button
                type="button"
                onClick={() => {
                  setBank(pending);
                  setSheetOpen(false);
                }}
                className="press text-[16px] text-link"
              >
                Confirm
              </button>
            </div>
            <BankWheel value={pending} onChange={setPending} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Scrollable dial-style picker (iOS wheel). */
function BankWheel({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = Math.max(0, BANKS.indexOf(value));
    el.scrollTop = index * ITEM_H;
    // run once on mount so the wheel starts on the current value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const index = Math.min(BANKS.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      el.scrollTo({ top: index * ITEM_H, behavior: "smooth" });
      const next = BANKS[index];
      if (next) onChange(next);
    }, 90);
  }

  return (
    <div className="relative py-4">
      <div
        className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 border-y border-border"
        style={{ height: ITEM_H }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-scrollbar overflow-y-auto overscroll-contain scroll-smooth"
        style={{ height: ITEM_H * 5, scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {BANKS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => {
              onChange(b);
              ref.current?.scrollTo({ top: BANKS.indexOf(b) * ITEM_H, behavior: "smooth" });
            }}
            className={`flex w-full items-center justify-center text-[17px] transition-colors ${
              value === b ? "font-semibold text-foreground" : "text-muted-foreground/70"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          >
            {b}
          </button>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}
