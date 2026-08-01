import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useSettings } from "@/lib/vanta";
import { useCenterToast } from "@/components/vanta/center-toast";
import checkinImage from "@/assets/oil-checkin.jpg";

export const Route = createFileRoute("/_authenticated/checkin")({
  head: () => ({
    meta: [
      { title: "Daily check-in — Vanta Oil" },
      { name: "description", content: "Check in daily on Vanta Oil to earn your UGX 300 sign-in bonus." },
      { property: "og:title", content: "Daily check-in — Vanta Oil" },
      {
        property: "og:description",
        content: "Check in daily on Vanta Oil to earn your UGX 300 sign-in bonus.",
      },
    ],
  }),
  component: CheckinPage,
});

function CheckinPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showCenterToast, showPillToast } = useCenterToast();
  const { data: profile } = useProfile();
  const days = profile?.checkin_days ?? 0;
  const settings = useSettings();
  const bonus = days * settings.checkin_bonus;
  const today = new Date().toISOString().slice(0, 10);
  const checkedIn = profile?.last_checkin_date === today;

  async function handleCheckin() {
    if (checkedIn) {
      showPillToast("You have already checked in today");
      return;
    }
    const { error } = await supabase.rpc("daily_checkin");
    if (error) {
      showPillToast(error.message);
      return;
    }
    await queryClient.invalidateQueries();
    showCenterToast("Check-in successful");
  }


  return (
    <div className="slide-in min-h-dvh bg-background">
      <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Go back"
          className="press -ml-1 p-1"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold">Check-in</h1>
      </header>

      <img
        src={checkinImage}
        alt="Oil drilling site at sunset with field workers"
        width={1280}
        height={512}
        className="h-32 w-full object-cover"
      />

      <h2 className="mt-8 text-center text-[30px] font-bold">Cumulative bonus</h2>

      <section className="mt-6 px-5">
        <div className="rounded-2xl bg-surface px-5 py-6 text-center">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" className="mx-auto" aria-hidden="true">
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
            <path d="M16.5 12h3" strokeLinecap="round" />
            <circle cx="16.8" cy="12" r="1.5" />
          </svg>
          <p className="mt-2 text-[22px] font-semibold">UGX {bonus}</p>
          <button
            type="button"
            onClick={() => showPillToast("No bonus available to withdraw yet")}
            className="press mt-4 rounded-full bg-primary px-8 py-3 text-[17px] font-bold text-primary-foreground"
          >
            Go to withdraw
          </button>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 divide-x divide-border px-5 text-center">
        <div>
          <div className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--background)">
                $
              </text>
            </svg>
            <p className="text-[24px] font-bold">UGX 300</p>
          </div>
          <p className="mt-2 text-[14px]">Daily Sign in Reward</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 3v3M16 3v3" strokeLinecap="round" />
              <path d="M7.5 13h1M11.5 13h1M15.5 13h1M7.5 17h1M11.5 17h1" strokeLinecap="round" />
            </svg>
            <p className="text-[24px] font-bold">{days} Days</p>
          </div>
          <p className="mt-2 text-[14px]">Check-in days</p>
        </div>
      </section>

      <section className="mt-8 px-5">
        <button
          type="button"
          onClick={handleCheckin}
          className="press w-full rounded-full bg-primary py-4 text-[22px] font-bold text-primary-foreground"
        >
          {checkedIn ? "Checked in" : "Check in"}
        </button>

        <ol className="mt-5 space-y-1.5 text-[15px] text-muted-foreground">
          <li>1. Daily check-in reward: 300 UGX</li>
          <li>2. Check in once a day.</li>
          <li>3. Check in again after 24:00 each day.</li>
        </ol>
      </section>
    </div>
  );
}
