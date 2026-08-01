import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  {
    to: "/home",
    label: "Home",
    icon: (
      <>
        <path d="M3.5 11 12 3.5l8.5 7.5" />
        <path d="M6 10.4V20.5h12V10.4" />
      </>
    ),
  },
  {
    to: "/products",
    label: "Product",
    icon: (
      <>
        <path d="M5 6.5c0-1.1 3.1-2 7-2s7 .9 7 2v11c0 1.1-3.1 2-7 2s-7-.9-7-2Z" />
        <path d="M5 6.5c0 1.1 3.1 2 7 2s7-.9 7-2" />
        <path d="M5 12c0 1.1 3.1 2 7 2s7-.9 7-2" />
      </>
    ),
  },
  {
    to: "/team",
    label: "Team",
    icon: (
      <>
        <circle cx="8.5" cy="8" r="3" />
        <circle cx="16.5" cy="9.5" r="2.4" />
        <path d="M3 18.5c.5-2.8 2.8-4.4 5.5-4.4s5 1.6 5.5 4.4" />
        <path d="M16 14.4c2.2.2 3.7 1.6 4.2 4.1" />
      </>
    ),
  },
  {
    to: "/mine",
    label: "My",
    icon: (
      <>
        <circle cx="12" cy="7.8" r="3.6" />
        <path d="M4.8 20.5c.7-3.9 3.6-6 7.2-6s6.5 2.1 7.2 6" />
      </>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 pt-2">
        {tabs.map((tab) => {
          const active = pathname === tab.to;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={`press flex flex-col items-center gap-1.5 py-1 text-[13px] ${
                  active ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.1 : 1.7}
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
