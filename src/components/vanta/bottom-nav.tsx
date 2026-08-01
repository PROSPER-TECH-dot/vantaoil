import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  {
    to: "/home",
    label: "Home",
    icon: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
      </>
    ),
  },
  {
    to: "/products",
    label: "Products",
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>
    ),
  },
  {
    to: "/team",
    label: "Team",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.2 19.5c.6-3.1 3-4.8 5.8-4.8s5.2 1.7 5.8 4.8" />
        <path d="M16 5.4a3.2 3.2 0 0 1 0 6.2" />
        <path d="M17.4 14.9c2.1.4 3.5 1.9 3.9 4.2" />
      </>
    ),
  },
  {
    to: "/mine",
    label: "Mine",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.5 20c.8-3.7 3.8-5.6 7.5-5.6s6.7 1.9 7.5 5.6" />
      </>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul
        className="mx-auto grid max-w-md grid-cols-4 rounded-3xl border border-border bg-card/95 p-1.5 backdrop-blur-xl"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {tabs.map((tab) => {
          const active = pathname === tab.to;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={`press flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold tracking-tight ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="21"
                  height="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {tab.icon}
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
