import { createFileRoute } from "@tanstack/react-router";

import { SubHeader } from "@/components/vanta/sub-header";

export const Route = createFileRoute("/_authenticated/regulation")({
  head: () => ({
    meta: [
      { title: "Regulation — Vanta Oil" },
      { name: "description", content: "Vanta Oil rules: referral commissions, check-in rewards and investment return plans." },
      { property: "og:title", content: "Regulation — Vanta Oil" },
      { property: "og:description", content: "Vanta Oil rules: referral commissions, check-in rewards and investment return plans." },
    ],
  }),
  component: RegulationPage,
});

const HIGHLIGHTS = [
  { icon: "🎁", text: "Register now and receive UGX2000!" },
  { icon: "📅", text: "Daily check-in rewards UGX300!" },
  { icon: "👥", text: "Invite friends to invest and immediately receive a high 39% cash commission!" },
  { icon: "💸", text: "Product earnings are automatically distributed 24 hours a day." },
  { icon: "🔥", text: "Daily returns up to 25%–40%!" },
  { icon: "🏆", text: "A popular money-making platform in Uganda, easily start your earning journey!" },
];

const PLANS = [
  ["UGX 20,000", "UGX 5,000"],
  ["UGX 50,000", "UGX 13,000"],
  ["UGX 100,000", "UGX 27,000"],
  ["UGX 200,000", "UGX 56,000"],
];

function RegulationPage() {
  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Regulation" />

      <div className="bg-charcoal px-4 py-3 text-charcoal-foreground">
        <div className="grid grid-cols-4 gap-2 text-[10px] leading-tight opacity-90">
          <p>Invest in a world-class oil producer.</p>
          <p>Earn stable daily income every day.</p>
          <p>Enjoy consistent returns for 300 days.</p>
          <p>Higher investment, higher returns.</p>
        </div>
        <p
          className="mx-auto mt-3 w-fit px-6 py-1 text-center text-[11px] font-bold text-primary-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          JOIN VANTA OIL TODAY AND BUILD YOUR FINANCIAL FUTURE!
        </p>
      </div>

      <div className="space-y-5 px-5 py-6 text-[16.5px] leading-[1.6] text-foreground/85">
        <p>
          VANTA OIL is now officially launching its franchise program, partnering with authorised oil
          distribution networks to share brand benefits and market opportunities. With resource
          support and mature operations, we help you quickly achieve profitability. Join now and
          seize the opportunity!
        </p>
        <div className="space-y-1.5">
          <p>When a friend you invite registers and invests, you will immediately receive a 35% cash reward on their investment.</p>
          <p>When members of your second-tier team invest, you will receive a 2% cash reward.</p>
          <p>When members of your third-tier team invest, you will receive a 2% cash reward.</p>
          <p>Once your team members invest, the cash reward will be immediately deposited into your account balance, which you can withdraw immediately.</p>
        </div>

        <ul className="space-y-1.5">
          {HIGHLIGHTS.map((h) => (
            <li key={h.text}>
              <span aria-hidden="true">{h.icon}</span> {h.text}
            </li>
          ))}
        </ul>

        <div>
          <p className="font-semibold">💼 Investment Return Plans</p>
          <ul className="mt-1.5 space-y-1.5">
            {PLANS.map(([invest, daily]) => (
              <li key={invest}>
                <span aria-hidden="true">💵</span> Invest {invest} <span aria-hidden="true">👉</span>{" "}
                Daily Earnings {daily}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
