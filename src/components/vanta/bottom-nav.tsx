import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  {
    to: "/home",
    label: "Home",
    icon: (
      <>
        <path d="M3.2 12.4 12 3.6l8.8 8.8" />
        <path d="M6.4 12.2v8.2h11.2v-8.2" />
      </>
    ),
  },
  {
    to: "/products",
    label: "Product",
    icon: (
      <>
        <path d="M12 3.2c3.9 4.6 6.2 7.9 6.2 10.7A6.2 6.2 0 0 1 12 20.4a6.2 6.2 0 0 1-6.2-6.5C5.8 11.1 8.1 7.8 12 3.2Z" />
        <path d="M9.1 14.4a2.9 2.9 0 0 0 2.9 2.9" />
      </>
    ),
  },
  {
    to: "/team",
    label: "Team",
    icon: (
      <>
        <circle cx="9.2" cy="7.4" r="3.2" />
        <path d="M3.4 19.4v-.9c0-2.4 2.6-4.1 5.8-4.1s5.8 1.7 5.8 4.1v.9Z" />
        <path d="M15.6 4.6a3 3 0 0 1 0 5.8" />
        <path d="M17 14.9c2.1.5 3.6 1.8 3.6 3.6v.9h-3.3" />
      </>
    ),
  },
  {
    to: "/mine",
    label: "My",
    icon: (
      <>
        <circle cx="12" cy="7.6" r="4" />
        <path d="M4.8 20.4c.6-4 3.5-6.2 7.2-6.2s6.6 2.2 7.2 6.2" />
      </>
    ),
  },
] as const;

export const NAV_PATHS = tabs.map((tab) => tab.to);

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
