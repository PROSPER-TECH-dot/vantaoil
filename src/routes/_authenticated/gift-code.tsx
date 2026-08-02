import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ConfirmButton, LineInput, StarLabel, SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import { supabase } from "@/integrations/supabase/client";
import { ugx, useSettings } from "@/lib/vanta";
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
  const { showPillToast, showCenterToast } = useCenterToast();
  const queryClient = useQueryClient();
  const settings = useSettings();
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return showPillToast("Please enter gift code");
    const { data, error } = await supabase.rpc("redeem_gift_code", { p_code: code.trim().toUpperCase() });
    if (error) return showPillToast(error.message);
    setCode("");
    await queryClient.invalidateQueries();
    showCenterToast(`Received ${ugx(Number(data ?? 0))}`);
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
          <p className="text-[15px] text-muted-foreground">You can get gift code from the WhatsApp group</p>

          <button
            type="button"
            onClick={() => {
              const link = settings.group_link?.trim();
              if (!link) {
                showPillToast("WhatsApp group is coming soon");
                return;
              }
              window.open(link, "_blank", "noopener,noreferrer");
            }}
            className="press mt-4 flex w-full items-center gap-3 border-b border-border pb-4 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.52 3.76 1.44 5.34L2 22l4.96-1.6a9.8 9.8 0 0 0 5.08 1.4h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.48 2 12.04 2Zm0 17.96h-.01a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.06.99.99-2.98-.19-.31a8.07 8.07 0 0 1-1.24-4.31c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.39a8.11 8.11 0 0 1 2.39 5.78c0 4.5-3.67 8.16-8.16 8.16Zm4.48-6.11c-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.25-.63.8-.77.97-.14.16-.28.18-.52.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.17.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
              </svg>
            </span>
            <span className="flex-1 text-[16px]">Official WhatsApp Group</span>
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
