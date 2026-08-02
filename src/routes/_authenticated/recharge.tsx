import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import { checkDeposit, startDeposit } from "@/lib/payments.functions";
import { useProfile, useSettings } from "@/lib/vanta";
import banner from "@/assets/recharge-banner.jpg";

export const Route = createFileRoute("/_authenticated/recharge")({
  head: () => ({
    meta: [
      { title: "Recharge — Vanta Oil" },
      { name: "description", content: "Top up your Vanta Oil balance by bank transfer and start investing in oil production." },
      { property: "og:title", content: "Recharge — Vanta Oil" },
      { property: "og:description", content: "Top up your Vanta Oil balance by bank transfer and start investing in oil production." },
    ],
  }),
  component: RechargePage,
});

const AMOUNTS = [20000, 30000, 60000, 120000, 300000, 500000, 1000000, 2000000];

function RechargePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showPillToast, showProcessingToast } = useCenterToast();
  const settings = useSettings();
  const { data: profile } = useProfile();
  const deposit = useServerFn(startDeposit);
  const pollDeposit = useServerFn(checkDeposit);
  const [amount, setAmount] = useState("20000");
  const [phone, setPhone] = useState("");
  const [touchedPhone, setTouchedPhone] = useState(false);
  const phoneValue = touchedPhone ? phone : (phone || profile?.phone || "");


  return (
    <div className="slide-in min-h-dvh bg-surface pb-10">
      <SubHeader
        title="Recharge"
        action={
          <button
            type="button"
            onClick={() => navigate({ to: "/recharge-records" })}
            aria-label="Recharge records"
            className="press p-1"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="4" width="17" height="16" rx="2" />
              <path d="M12 8v6M9.2 11.4 12 14.2l2.8-2.8" />
            </svg>
          </button>
        }
      />

      <section className="px-4 pt-2">
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src={banner}
            alt="Oil pump jack silhouette on a dark blue background"
            loading="lazy"
            width={1280}
            height={560}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative px-6 py-8 text-night-foreground">
            <p className="text-[30px] font-semibold opacity-90">Recharge amount</p>
            <div className="mt-6 flex items-end gap-6 border-b border-night-foreground/40 pb-2">
              <span className="text-[28px] font-semibold">UGX</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={9}
                aria-label="Recharge amount"
                className="w-full bg-transparent text-[22px] outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <Divider label="Quickly select amount" />

      <section className="px-4">
        <div className="grid grid-cols-4 gap-3 rounded-3xl bg-background p-4">
          {AMOUNTS.map((a) => {
            const active = String(a) === amount;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                className={`press rounded-xl py-4 text-[14px] ${
                  active ? "bg-primary font-semibold text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {a.toLocaleString()}
              </button>
            );
          })}
        </div>
      </section>

      <Divider label="Choose recharge channel" />

      <section className="px-4">
        <div className="rounded-3xl bg-background p-4">
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-4 text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <span className="flex-1 text-[18px]">Bank</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m4.5 12.5 5 5L20 7" />
            </svg>
          </div>
        </div>
      </section>

      <Divider label="Mobile money number" />

      <section className="px-4">
        <div className="rounded-3xl bg-background p-4">
          <input
            value={phoneValue}
            onChange={(e) => {
              setTouchedPhone(true);
              setPhone(e.target.value.replace(/[^\d+]/g, ""));
            }}
            inputMode="tel"
            maxLength={15}
            placeholder="Enter your mobile money number e.g. 0770000000"
            aria-label="Mobile money number"
            className="w-full rounded-xl bg-secondary px-4 py-4 text-[16px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      </section>

      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={async () => {
            if (Number(amount) < settings.min_recharge) {
              showPillToast(`The minimum recharge amount is UGX ${settings.min_recharge.toLocaleString("en-US")}`);
              return;
            }
            const digits = phoneValue.replace(/\D/g, "");
            if (digits.length < 9) {
              showPillToast("Enter a valid mobile money number");
              return;
            }
            await showProcessingToast("Processing payment...", 2500);
            try {
              await deposit({ data: { amount: Number(amount), msisdn: phoneValue } });
              await queryClient.invalidateQueries();
              showPillToast("Approve the payment prompt on your phone");
            } catch (error) {
              showPillToast(error instanceof Error ? error.message : "Payment could not be started");
            }
          }}
          className="press mx-auto block w-[62%] rounded-full py-3.5 text-[19px] font-bold text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
        >
          Confirm
        </button>
      </div>


      <button
        type="button"
        onClick={() => navigate({ to: "/recharge-problem" })}
        className="press mt-4 w-full px-5 text-center text-[17px]"
      >
        If the recharge is not entered for a long time, please click here
      </button>

      <div className="mt-5 space-y-2 px-5 text-[15.5px] leading-[1.55] text-muted-foreground">
        <p>1. The minimum recharge amount is UGX {settings.min_recharge.toLocaleString("en-US")}. If it is lower than the minimum amount, the money will not be credited.</p>
        <p>2. Recharged funds can only be used to purchase products. They are not withdrawable.</p>
        <p>3. The wallet number filled in must be the same as the final payment wallet number.</p>
        <p>4. Please wait for 10-20 minutes after the transfer is successful. If your money has not been credited for a long time, please submit your transfer voucher at the top of the page.</p>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[15px] text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
