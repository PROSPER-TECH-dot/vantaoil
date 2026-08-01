import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ConfirmButton, LineInput, StarLabel, SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";

export const Route = createFileRoute("/_authenticated/bind-bank")({
  head: () => ({
    meta: [
      { title: "Bind Bank Card — Vanta Oil" },
      { name: "description", content: "Bind your MTN or Airtel mobile money account to withdraw Vanta Oil earnings." },
      { property: "og:title", content: "Bind Bank Card — Vanta Oil" },
      { property: "og:description", content: "Bind your MTN or Airtel mobile money account to withdraw Vanta Oil earnings." },
    ],
  }),
  component: BindBankPage,
});

const BANKS = ["MTN", "Airtel"];

function BindBankPage() {
  const { showPillToast } = useCenterToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, setPending] = useState("MTN");
  const [bank, setBank] = useState("");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!bank) return showPillToast("Please select a bank");
    if (!holder.trim()) return showPillToast("Please enter account holder name");
    if (!/^\d{6,15}$/.test(account.trim())) return showPillToast("Please enter a valid bank account number");
    showPillToast("Bank card bound successfully");
  }

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Bind Bank Card" />

      <form onSubmit={submit} className="px-4 pt-4">
        <div className="rounded-3xl bg-background px-6 py-8">
          <StarLabel>Select Bank</StarLabel>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="press mt-3 w-full border-b border-border pb-2.5 text-left text-[16px]"
          >
            <span className={bank ? "" : "text-muted-foreground/80"}>{bank || "Please select"}</span>
          </button>

          <div className="mt-9">
            <StarLabel>Account Holder Name</StarLabel>
            <LineInput
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              maxLength={80}
              placeholder="Please enter account holder name"
            />
          </div>

          <div className="mt-9">
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

        <div className="py-7">
          <ConfirmButton>Confirm</ConfirmButton>
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
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <button type="button" onClick={() => setSheetOpen(false)} className="press text-[17px] text-link">
                Cancel
              </button>
              <p className="text-[18px] font-bold">Select Bank</p>
              <button
                type="button"
                onClick={() => {
                  setBank(pending);
                  setSheetOpen(false);
                }}
                className="press text-[17px] text-link"
              >
                Confirm
              </button>
            </div>
            <div className="py-10">
              {BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setPending(b)}
                  className={`press block w-full border-b border-border py-4 text-center text-[19px] ${
                    pending === b ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
