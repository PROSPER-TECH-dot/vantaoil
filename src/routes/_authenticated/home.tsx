import { createFileRoute, Link } from "@tanstack/react-router";

import heroImage from "@/assets/oil-rig-hero.jpg";
import cardsImage from "@/assets/oil-cards.jpg";
import plantImage from "@/assets/oil-plant.jpg";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Vanta Oil" },
      { name: "description", content: "Your Vanta Oil balance, recharges, withdrawals and daily check-in." },
      { property: "og:title", content: "Home — Vanta Oil" },
      {
        property: "og:description",
        content: "Your Vanta Oil balance, recharges, withdrawals and daily check-in.",
      },
    ],
  }),
  component: HomePage,
});

const actions = [
  {
    label: "Recharge",
    to: "/recharge" as const,

    icon: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
        <path d="M6 14.5h4" />
      </>
    ),
  },
  {
    label: "Withdraw",
    icon: (
      <>
        <rect x="3.5" y="8.5" width="17" height="11" rx="2" />
        <circle cx="12" cy="14" r="2.4" />
        <path d="M7 4.5h10" />
      </>
    ),
  },
  {
    label: "Service",
    to: "/customer-service" as const,

    icon: (
      <>
        <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
        <rect x="2.5" y="13.5" width="4" height="6" rx="1.8" />
        <rect x="17.5" y="13.5" width="4" height="6" rx="1.8" />
      </>
    ),
  },
  {
    label: "Check-in",
    to: "/checkin" as const,
    icon: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="m8.5 13 2.5 2.5L16 10" />
        <path d="m5 4 2.5-1.8M19 4l-2.5-1.8" />
      </>
    ),
  },
] as const;

const stats = [
  { value: "0.00", label: "Balance" },
  { value: "0.00", label: "Cumulative" },
  { value: "0", label: "Withdrawn" },
] as const;

const ticker = [
  "**49097352 recharged 38000 UGX",
  "**61663097 recharged 100000 UGX",
  "**25536469 recharged 15000 UGX",
  "**54012288 recharged 62000 UGX",
];

function HomePage() {
  return (
    <div className="slide-in bg-background">
      <section className="relative bg-charcoal">
        <img
          src={heroImage}
          alt="Oil drilling rig derrick lit up at night"
          width={1280}
          height={960}
          className="h-64 w-full object-cover"
        />
        <div className="grid grid-cols-3 divide-x divide-charcoal-foreground/20 bg-charcoal px-3 py-5 text-center text-charcoal-foreground">
          <div className="px-1">
            <p className="text-[13px] font-bold">30+ active wells</p>
            <p className="mt-1 text-[12px] text-charcoal-foreground/60">Advanced drilling system</p>
          </div>
          <div className="px-1">
            <p className="text-[13px] font-bold">Refinery output</p>
            <p className="mt-1 text-[12px] text-charcoal-foreground/60">processing platform</p>
          </div>
          <div className="px-1">
            <p className="text-[13px] font-bold">1 on 1</p>
            <p className="mt-1 text-[12px] text-charcoal-foreground/60">Customized private AI</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2 px-4 pt-6 pb-5">
        {actions.map((action) => {
          const cls = "press flex flex-col items-center gap-2 text-[13px] font-semibold";
          const inner = (
            <>
              <svg
                viewBox="0 0 24 24"
                width="34"
                height="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {action.icon}
              </svg>
              {action.label}
            </>
          );
          return "to" in action ? (
            <Link key={action.label} to={action.to} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={action.label} type="button" className={cls}>
              {inner}
            </button>
          );
        })}
      </section>


      <section className="grid grid-cols-3 gap-2.5 px-4">
        {stats.map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-2xl">
            <img
              src={cardsImage}
              alt="Oil tanker trucks at a mining site"
              width={1024}
              height={640}
              loading="lazy"
              className="h-24 w-full object-cover"
            />
            <div className="absolute inset-0 bg-charcoal/45" />
            <div className="absolute inset-x-0 bottom-0 p-2.5 text-charcoal-foreground">
              <p className="text-[20px] leading-tight font-bold">{stat.value}</p>
              <p className="text-[13px] opacity-90">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4 px-4">
        <div className="flex items-center gap-3 overflow-hidden rounded-full border border-border bg-background py-2 pr-3 pl-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-charcoal text-charcoal-foreground">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
              <path d="M10 18.5a2 2 0 0 0 4 0" />
            </svg>
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="ticker-track whitespace-nowrap">
              {[...ticker, ...ticker].map((item, index) => (
                <span key={index} className="px-6 text-[15px] text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="relative">
          <img
            src={plantImage}
            alt="Oil refinery plant with pipelines"
            width={1280}
            height={560}
            loading="lazy"
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/35 text-charcoal-foreground">
            <p className="text-[22px] font-bold">Phase 1 Delivery Plan</p>
            <p className="mt-1 text-[16px] font-semibold">Started on May 31</p>
          </div>
        </div>
      </section>
    </div>
  );
}
