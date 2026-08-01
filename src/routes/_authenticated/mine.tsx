import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import taskImage from "@/assets/oil-plant.jpg";

export const Route = createFileRoute("/_authenticated/mine")({
  head: () => ({
    meta: [
      { title: "My account — Vanta Oil" },
      { name: "description", content: "View your Vanta Oil balance, income and account tools." },
      { property: "og:title", content: "My account — Vanta Oil" },
      { property: "og:description", content: "View your Vanta Oil balance, income and account tools." },
    ],
  }),
  component: MinePage,
});

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function MinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showPillToast } = useCenterToast();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();
      return {
        full_name: data?.full_name ?? (user.user_metadata["full_name"] as string | undefined) ?? "",
        email: data?.email ?? user.email ?? "",
        phone: data?.phone ?? "",
      };
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    showPillToast("Logged out");
    navigate({ to: "/login", replace: true });
  }

  const wallet = [
    {
      label: "Recharge",
      to: "/recharge" as const,

      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" {...S} aria-hidden="true">
          <path d="M8.5 6.5h7l1.6 3.2A6.6 6.6 0 0 1 12 20.5a6.6 6.6 0 0 1-5.1-10.8Z" />
          <path d="M9.5 6.5 8 3.5h8l-1.5 3M9.8 12h4.4M9.8 14.6h4.4M12 10.6v6" />
        </svg>
      ),
    },
    {
      label: "Withdraw",
      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" {...S} aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="7" rx="1.6" />
          <path d="M7 11.5v5.2a1.6 1.6 0 0 0 1.6 1.6h6.8a1.6 1.6 0 0 0 1.6-1.6v-5.2" />
          <path d="M10.5 15h3" />
        </svg>
      ),
    },
    {
      label: "Record",
      icon: (
        <svg viewBox="0 0 24 24" width="30" height="30" {...S} aria-hidden="true">
          <rect x="5" y="4" width="14" height="17" rx="2.2" />
          <path d="M9 3h6v3H9zM9 11h6M9 14.5h6M9 18h4" />
        </svg>
      ),
    },
  ];

  const tools: { label: string; to: string | null; icon: React.ReactNode }[] = [
    {
      label: "About us",
      to: "/about",

      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.6h.01" />
        </svg>
      ),
    },
    {
      label: "Customer Service",
      to: "/customer-service",
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <path d="M20 13a8 8 0 1 0-3.4 6.5" />
          <rect x="15.5" y="9.5" width="4" height="6" rx="1.6" />
          <rect x="4.5" y="9.5" width="4" height="6" rx="1.6" />
        </svg>
      ),
    },
    {
      label: "Record",
      to: null,
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <path d="M19 10V6.2A2.2 2.2 0 0 0 16.8 4H7.2A2.2 2.2 0 0 0 5 6.2v12.6A2.2 2.2 0 0 0 7.2 21h5" />
          <path d="M9 3h6v3H9zM9 10h6M9 13.5h4" />
          <circle cx="17" cy="17" r="4" />
          <path d="m15.4 17 1.2 1.2 2.2-2.4" />
        </svg>
      ),
    },
    {
      label: "Regulation",
      to: "/regulation",
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <path d="M19 11V6.2A2.2 2.2 0 0 0 16.8 4H7.2A2.2 2.2 0 0 0 5 6.2v12.6A2.2 2.2 0 0 0 7.2 21H12" />
          <path d="M9 3h6v3H9zM9 10h6M9 13.5h3" />
          <circle cx="17.5" cy="17.5" r="2" />
          <path d="M17.5 14.4v1M17.5 19.6v1M14.4 17.5h1M19.6 17.5h1" />
        </svg>
      ),
    },
    {
      label: "Download APP",
      to: null,
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <path d="M12 4v10M8 10.5l4 4 4-4M5 19h14" />
        </svg>
      ),
    },
    {
      label: "Bind bank card",
      to: "/bind-bank",
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
          <path d="M3 9.8h18M15.5 15.2h3" />
        </svg>
      ),
    },
    {
      label: "Change Pwd",
      to: "/change-password",
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
          <path d="M8 10V7.5a4 4 0 0 1 8 0V10M9 15.3h.01M12 15.3h.01M15 15.3h.01" />
        </svg>
      ),
    },
    {
      label: "Redeem Gift",
      to: null,
      icon: (
        <svg viewBox="0 0 24 24" width="28" height="28" {...S} aria-hidden="true">
          <rect x="3.5" y="8.5" width="17" height="11.5" rx="1.8" />
          <path d="M3.5 12.5h17M12 8.5V20" />
          <path d="M12 8.5S10.6 4 8.4 4a2.2 2.2 0 0 0 0 4.5ZM12 8.5S13.4 4 15.6 4a2.2 2.2 0 0 1 0 4.5Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="slide-in min-h-dvh pb-28" style={{ background: "var(--gradient-mine)" }}>
      <header className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <p className="truncate text-[24px] font-bold">{profile?.phone || "+256 000000000"}</p>
        <span className="mt-2 inline-block rounded-full bg-primary px-5 py-1.5 text-[16px] font-semibold text-primary-foreground">
          Lv1
        </span>
      </header>

      <section className="mt-14 grid grid-cols-2 gap-4 px-5">
        <div className="min-w-0">
          <p className="text-[26px] font-bold">UGX 0</p>
          <p className="mt-1.5 text-[16px] text-muted-foreground">Account Balance</p>
        </div>
        <div className="min-w-0">
          <p className="text-[26px] font-bold">UGX 0</p>
          <p className="mt-1.5 text-[16px] text-muted-foreground">Cumulative income</p>
        </div>
      </section>

      <section className="mt-6 px-4">
        <div className="grid grid-cols-3 rounded-2xl bg-surface py-5">
          {wallet.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                "to" in item && item.to
                  ? navigate({ to: item.to })
                  : showPillToast(`${item.label} is coming soon`)
              }

              className="press flex flex-col items-center gap-2 text-muted-foreground"
            >
              {item.icon}
              <span className="text-[14px]">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={taskImage}
            alt="Oil processing plant at work"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in oklab, var(--night) 70%, transparent), transparent 75%)",
            }}
          />
          <div className="relative px-5 py-7 text-night-foreground">
            <p className="text-[26px] font-bold">Task Center</p>
            <p className="mt-1 text-[15px]">Complete the task and earn high rewards</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/checkin" })}
              className="press mt-4 rounded-full bg-background px-12 py-2.5 text-[16px] font-semibold text-foreground"
            >
              Go
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-4 gap-y-7 px-3">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() =>
              tool.to
                ? navigate({ to: tool.to })
                : showPillToast(`${tool.label} is coming soon`)
            }

            className="press flex flex-col items-center gap-2 px-1 text-center"
          >
            {tool.icon}
            <span className="text-[13px] leading-tight">{tool.label}</span>
          </button>
        ))}
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="press mt-10 flex w-full items-center justify-between px-5 py-4 text-left text-[17px]"
      >
        <span>Log out of account</span>
        <svg viewBox="0 0 24 24" width="18" height="18" {...S} aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
