import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ConfirmButton, LineInput, StarLabel, SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import giftHero from "@/assets/gift-hero.jpg";

export const Route = createFileRoute("/_authenticated/gift-code")({
  head: () => ({
    meta: [
      { title: "Redeem Gift — Vanta Oil" },
      { name: "description", content: "Redeem your Vanta Oil gift code and claim bonus rewards instantly." },
      { property: "og:title", content: "Redeem Gift — Vanta Oil" },
      { property: "og:description", content: "Redeem your Vanta Oil gift code and claim bonus rewards instantly." },
    ],
  }),
  component: GiftCodePage,
});

function GiftCodePage() {
  const { showPillToast } = useCenterToast();
  const [code, setCode] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return showPillToast("Please enter gift code");
    showPillToast("Invalid or expired gift code");
  }

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Redeem Gift" />

      <img
        src={giftHero}
        alt="Oil field workers checking a gift code on a phone"
        width={1280}
        height={720}
        className="h-44 w-full object-cover"
      />

      <form onSubmit={submit} className="px-4 pt-4">
        <div className="rounded-3xl bg-background px-5 py-6">
          <p className="text-[15px] text-muted-foreground">You can get gift code from telegram group</p>

          <button
            type="button"
            onClick={() => showPillToast("Telegram group is coming soon")}
            className="press mt-4 flex w-full items-center gap-3 border-b border-border pb-4 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-link/10 text-link">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M21.3 4.3 2.9 11.4c-.9.3-.9 1.5.1 1.8l4.6 1.4 1.7 5.1c.3.8 1.3.9 1.8.3l2.5-2.8 4.6 3.4c.7.5 1.6.1 1.8-.7l3-13.6c.2-.9-.7-1.6-1.7-1.3Z" />
              </svg>
            </span>
            <span className="flex-1 text-[16px]">Official Telegram Group</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>

          <div className="mt-6">
            <StarLabel>Gift Code</StarLabel>
            <LineInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={32}
              placeholder="Please enter gift code"
            />
          </div>
        </div>

        <div className="py-7">
          <ConfirmButton>Confirm</ConfirmButton>
        </div>
      </form>
    </div>
  );
}
