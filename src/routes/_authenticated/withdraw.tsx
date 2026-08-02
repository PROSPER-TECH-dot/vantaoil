import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import { startWithdrawal } from "@/lib/payments.functions";
import { ugx, useProfile, useSettings } from "@/lib/vanta";
import { useBankAccounts } from "./bind-bank";
import withdrawImage from "@/assets/pumpjack-free.png";

export const Route = createFileRoute("/_authenticated/withdraw")({
  validateSearch: (search: Record<string, unknown>) => ({
    card: typeof search['card'] === "string" ? (search['card'] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Withdraw — Vanta Oil" },
      { name: "description", content: "Withdraw your Vanta Oil earnings to your mobile money account from UGX 5,000." },
      { property: "og:title", content: "Withdraw — Vanta Oil" },
      { property: "og:description", content: "Withdraw your Vanta Oil earnings to your mobile money account from UGX 5,000." },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast, showProcessingToast } = useCenterToast();
  const { data: profile } = useProfile();
  const settings = useSettings();
  const withdraw = useServerFn(startWithdrawal);
  const [amount, setAmount] = useState("");
  const { data: cards } = useBankAccounts();
  const { card: cardId } = Route.useSearch();
  const card = (cards ?? []).find((c) => c.id === cardId) ?? null;


  async function handleConfirm() {
    const value = Number(amount);
    if (!value) {
      showPillToast("Enter withdrawal amount");
      return;
    }
    if (value < settings.min_withdrawal) {
      showPillToast(`The minimum withdrawal amount is UGX ${settings.min_withdrawal.toLocaleString("en-US")}`);
      return;
    }
    if ((profile?.products_count ?? 0) < 1) {
      showPillToast("You must own at least one product to withdraw");
      return;
    }
    if (!card) {
      showPillToast(cards && cards.length > 0 ? "Please select a bank card" : "Please bind a bank account first");
      return;
    }
    await showProcessingToast("Processing withdrawal...", 2500);
    try {
      await withdraw({ data: { amount: value, msisdn: card.account } });
      setAmount("");
      await queryClient.invalidateQueries();
      showCenterToast("Withdrawal submitted");
    } catch (error) {
      showPillToast(error instanceof Error ? error.message : "Withdrawal could not be submitted");
    }
  }


  return (
    <div className="slide-in min-h-dvh bg-surface pb-10">
      <SubHeader
        title="Withdraw"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/withdrawal-records" })}
            aria-label="Withdrawal records"
            className="press p-1"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="4" width="17" height="16" rx="2" />
              <path d="M12 8v6M9.2 11.4 12 14.2l2.8-2.8" />
            </svg>
          </button>
        }
      />

      <section className="px-0" style={{ background: "var(--gradient-mine)" }}>
        <div className="px-5 pt-6 text-center">
          <p className="text-[28px] font-bold">{ugx(profile?.balance ?? 0)}</p>
          <p className="mt-1 text-[16px] text-muted-foreground">My Balance</p>
        </div>

        <img
          src={withdrawImage}
          alt="Oil pump jack mining unit"
          width={1024}
          height={768}
          loading="lazy"
          className="mx-auto block h-44 w-auto max-w-full bg-transparent object-contain"
        />

        <div className="px-4 pb-8">
          <div className="flex items-center gap-4 rounded-2xl bg-background px-5 py-4">
            <span className="text-[22px] font-semibold">UGX</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={9}
              aria-label="Withdrawal amount"
              placeholder="Enter withdrawal amount"
              className="w-full bg-transparent text-[18px] outline-none placeholder:text-muted-foreground/80"
            />
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <button
          type="button"
          onClick={() => navigate({ to: "/bind-bank", search: { select: true } })}

          className="press flex w-full items-center gap-4 rounded-2xl bg-background px-5 py-5 text-left"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M3 10h18M15.5 14.5h3" strokeLinecap="round" />
          </svg>
          {card ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-semibold">
                {card.bank} · {card.account}
              </span>
              <span className="block truncate text-[14px] text-muted-foreground">{card.holder}</span>
            </span>
          ) : (
            <span className="flex-1 truncate text-[17px] tracking-widest text-muted-foreground">
              {cards && cards.length > 0 ? "Select bank card" : "_____-__________"}
            </span>
          )}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </section>

      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={handleConfirm}
          className="press mx-auto block w-[62%] rounded-full py-3.5 text-[19px] font-bold text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          Confirm
        </button>
      </div>




      <div className="mt-6 space-y-2 px-5 text-[15.5px] leading-[1.55] text-muted-foreground">
        <p>1. The minimum withdrawal amount is UGX {settings.min_withdrawal.toLocaleString("en-US")}.</p>
        <p>2. The withdrawal fee is {settings.withdrawal_fee_percent}% of the withdrawal amount.</p>
        <p>3. There is no limit on the withdrawal time, and you can withdraw multiple times at any time.</p>
        <p>4. Withdrawals are generally credited within 4 hours, and within 24 hours at the latest.</p>
        <p>5. You must have at least one purchased product to enable the withdrawal function.</p>
        <p>6. Only income can be withdrawn. Recharged funds are used to purchase products.</p>
      </div>
    </div>
  );
}
