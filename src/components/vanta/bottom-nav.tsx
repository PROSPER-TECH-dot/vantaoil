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
        <path d="M3.4 13.2c0-2 .6-3.6 1.6-4.7C6.4 7.1 8.8 6.4 12 6.4s5.6.7 7 2.1c1 1.1 1.6 2.7 1.6 4.7v2.7c0 1-.8 1.7-1.8 1.7h-.8c-1 0-1.8-.7-1.8-1.7v-.5H7.8v.5c0 1-.8 1.7-1.8 1.7h-.8c-1 0-1.8-.7-1.8-1.7Z" />
        <circle cx="7.6" cy="12.4" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="16.4" cy="12.4" r="1.1" fill="currentColor" stroke="none" />
        <path d="M10 12.6h4" />
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
