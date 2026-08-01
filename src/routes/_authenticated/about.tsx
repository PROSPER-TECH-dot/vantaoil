import { createFileRoute } from "@tanstack/react-router";

import { SubHeader } from "@/components/vanta/sub-header";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "About Us — Vanta Oil" },
      { name: "description", content: "Learn about Vanta Oil, an oil mining and energy investment platform operating in Uganda." },
      { property: "og:title", content: "About Us — Vanta Oil" },
      { property: "og:description", content: "Learn about Vanta Oil, an oil mining and energy investment platform operating in Uganda." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="About Us" />
      <div className="space-y-6 px-5 py-6 text-[17px] leading-[1.65] text-foreground/85">
        <p>
          Founded in 2011, Vanta Oil is a leading energy and oil mining group. As a pioneer of
          community-backed oil field development, Vanta Oil is committed to responsible extraction,
          modern refining technology and transparent returns for every partner who invests in our
          production capacity.
        </p>
        <p>
          After more than a decade of development, Vanta Oil has grown into a globally recognised oil
          mining brand, operating drilling platforms, pump stations and storage terminals across
          multiple regions. Our production units are monitored around the clock, and revenue from
          every barrel produced is settled automatically to partner accounts every 24 hours.
        </p>
        <p>
          Vanta Oil now operates officially in Uganda, partnering with local distributors and mobile
          money providers so that anyone can join the energy economy. With resource support, mature
          operations and a franchise programme built for stable daily income, we help our partners
          reach profitability quickly and withdraw their earnings without delay.
        </p>
      </div>
    </div>
  );
}
