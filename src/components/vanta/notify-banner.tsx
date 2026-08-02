import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useSettings } from "@/lib/vanta";
import bannerImage from "@/assets/notify-banner.jpg";

export function NotifyBanner() {
  const settings = useSettings();
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const groupLink = settings.group_link?.trim() ?? "";

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-charcoal/60 px-6">
      <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-background shadow-2xl">
        <div className="relative">
          <img
            src={bannerImage}
            alt="Oil mining site with drilling rig and pumpjack at sunset"
            width={1024}
            height={576}
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 grid place-items-center bg-charcoal/35">
            <p className="text-[26px] font-bold tracking-wide text-charcoal-foreground">NOTIFY</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="press absolute top-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full bg-charcoal/60 text-charcoal-foreground"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-1.5 px-5 pt-4 pb-5 text-[14px] leading-relaxed text-foreground">
          <p>🛢️ Welcome to Vanta Oil</p>
          <p>Explore a premium oil mining platform powered by advanced drilling and refinery technology.</p>
          <p>⚡ Easy and convenient to participate</p>
          <p>📊 Generous referral rewards</p>
          <p>🎁 Daily benefits for active members</p>
          <p>🌍 More ways to explore new opportunities</p>

          {groupLink ? (
            <a
              href={groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-[14px] underline underline-offset-4"
            >
              Click to join the official WhatsApp group
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="press mt-4 w-full rounded-xl bg-charcoal py-3 text-[16px] font-bold text-charcoal-foreground"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
