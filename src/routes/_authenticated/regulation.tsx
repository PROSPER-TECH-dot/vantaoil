import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SubHeader } from "@/components/vanta/sub-header";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/vanta";

export const Route = createFileRoute("/_authenticated/regulation")({
  head: () => ({
    meta: [
      { title: "Regulation — Vanta Oil" },
      { name: "description", content: "Vanta Oil rules: referral commissions, check-in rewards, deposits, withdrawals and investment return plans." },
      { property: "og:title", content: "Regulation — Vanta Oil" },
      { property: "og:description", content: "Vanta Oil rules: referral commissions, check-in rewards, deposits, withdrawals and investment return plans." },
    ],
  }),
  component: RegulationPage,
});

const money = (value: number) => `UGX ${Number(value || 0).toLocaleString("en-US")}`;

function RegulationPage() {
  const settings = useSettings();

  const { data: plans } = useQuery({
    queryKey: ["regulation", "plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("code, name, price, daily, term")
        .order("sort_order", { ascending: true })
        .limit(4);
      return data ?? [];
    },
  });

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Regulation" />

      <div className="bg-charcoal px-4 py-3 text-charcoal-foreground">
        <div className="grid grid-cols-4 gap-2 text-[10px] leading-tight opacity-90">
          <p>Invest in a world-class oil producer.</p>
          <p>Earn stable daily income every 24 hours.</p>
          <p>Income runs for the full product term.</p>
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

        <Section title="🎁 Rewards">
          <p>New members receive a welcome bonus of {money(settings.welcome_bonus)} once the account is created with a valid invitation code.</p>
          <p>Daily check-in rewards {money(settings.checkin_bonus)} — you can check in once every day.</p>
          <p>Every product pays its daily income automatically every 24 hours, counted from the exact time of purchase, until the product term ends.</p>
        </Section>

        <Section title="👥 Referral system">
          <p>An invitation code is required to register, so every member belongs to a team.</p>
          <p>Level 1: when a member you invited buys their first product you instantly receive 15% of that purchase amount.</p>
          <p>Level 2: you receive 3% of the first purchase of your level 2 members.</p>
          <p>Level 3: you receive 1% of the first purchase of your level 3 members.</p>
          <p>Commission is paid on the first product purchase of each team member only, and it is credited straight to your balance and cumulative income — withdrawable immediately.</p>
        </Section>

        <Section title="💰 Deposits">
          <p>The minimum deposit is {money(settings.min_recharge)}. Anything lower will not be credited.</p>
          <p>Deposits are made by mobile money — approve the payment prompt on your phone and the funds are credited automatically once payment is confirmed.</p>
          <p>Deposited funds can only be used to purchase products; they are not withdrawable.</p>
          <p>If a deposit has not arrived after 20 minutes, submit your voucher on the Recharge Problem page.</p>
        </Section>

        <Section title="🏦 Withdrawals">
          <p>The minimum withdrawal is {money(settings.min_withdrawal)}.</p>
          <p>The withdrawal fee is {settings.withdrawal_fee_percent}% of the withdrawal amount.</p>
          <p>You must own at least one product before you can withdraw.</p>
          <p>Only income — daily earnings, check-in bonuses, gift codes and team commissions — can be withdrawn.</p>
          <p>Payouts are sent to your bound mobile money number, generally within 4 hours and within 24 hours at the latest.</p>
        </Section>

        {plans && plans.length > 0 ? (
          <Section title="💼 Investment return plans">
            {plans.map((plan) => (
              <p key={plan.code}>
                <span aria-hidden="true">💵</span> Invest {money(plan.price)} <span aria-hidden="true">👉</span>{" "}
                Daily earnings {money(plan.daily)} for {plan.term}
              </p>
            ))}
            <p>See the Products page for the full list of available plans.</p>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </div>
  );
}
