import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { LineInput, StarLabel, SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";

export const Route = createFileRoute("/_authenticated/recharge-problem")({
  head: () => ({
    meta: [
      { title: "Recharge Problem — Vanta Oil" },
      { name: "description", content: "Submit your wallet number, amount and transfer voucher if a Vanta Oil recharge has not arrived." },
      { property: "og:title", content: "Recharge Problem — Vanta Oil" },
      { property: "og:description", content: "Submit your wallet number, amount and transfer voucher if a Vanta Oil recharge has not arrived." },
    ],
  }),
  component: RechargeProblemPage,
});

function RechargeProblemPage() {
  const { showPillToast, showCenterToast } = useCenterToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [fileName, setFileName] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet.trim()) return showPillToast("Please enter your wallet number");
    if (!amount.trim()) return showPillToast("Please enter recharge amount");
    if (!fileName) return showPillToast("Please upload your recharge certificate");
    showCenterToast("Submitted successfully");
    setWallet("");
    setAmount("");
    setFileName("");
  }

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Recharge Problem" />

      <form onSubmit={submit} className="px-4 pt-2">
        <div className="rounded-2xl bg-background px-5 py-6">
          <StarLabel>Wallet number</StarLabel>
          <LineInput
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            maxLength={30}
            placeholder="Please enter your wallet number"
          />

          <div className="mt-6">
            <StarLabel>Recharge amount</StarLabel>
            <LineInput
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={9}
              placeholder="Please enter recharge amount"
            />
          </div>

          <div className="mt-6">
            <StarLabel>Recharge certificate</StarLabel>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="press mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-muted-foreground"
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="6.5" width="18" height="13" rx="2.4" />
                <circle cx="12" cy="13" r="3.4" />
                <path d="M8.5 6.5 9.8 4h4.4l1.3 2.5" />
              </svg>
              <span className="text-[17px]">{fileName || "Click to upload"}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </div>
        </div>

        <div className="py-7">
          <button
            type="submit"
            className="press mx-auto block w-[62%] rounded-full py-3.5 text-[19px] font-bold text-primary-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
          >
            Submit
          </button>
        </div>
      </form>

      <div className="space-y-3 px-5 pb-10 text-[16px] leading-[1.55] text-muted-foreground">
        <p>If you have a recharge order that hasn&apos;t arrived, please submit the recharge information.</p>
        <p>1. Your wallet number</p>
        <p>2. Recharge certificate</p>
        <p>3. The processing time of the last recharge order exceeds 20 minutes</p>
      </div>
    </div>
  );
}
