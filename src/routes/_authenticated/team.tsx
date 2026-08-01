import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import teamImage from "@/assets/oil-team.jpg";
import { supabase } from "@/integrations/supabase/client";
import { inviteLink as buildInviteLink, ugx, useProfile } from "@/lib/vanta";
import { useCenterToast } from "@/components/vanta/center-toast";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — Vanta Oil" },
      { name: "description", content: "Invite friends to Vanta Oil and earn commission on every investment your team makes." },
      { property: "og:title", content: "Team — Vanta Oil" },
      {
        property: "og:description",
        content: "Invite friends to Vanta Oil and earn commission on every investment your team makes.",
      },
    ],
  }),
  component: TeamPage,
});

const LEVELS = [
  { level: "Lv1", commission: "15%", tint: "var(--gradient-lv1)", text: "var(--primary)" },
  { level: "Lv2", commission: "3%", tint: "var(--gradient-lv2)", text: "var(--lv2)" },
  { level: "Lv3", commission: "1%", tint: "var(--gradient-lv3)", text: "var(--lv3)" },
];

function TeamPage() {
  const { showPillToast } = useCenterToast();
  const { data: profile } = useProfile();

  const { data: levels } = useQuery({
    queryKey: ["team-summary"],
    queryFn: async () => {
      const results = await Promise.all(
        [1, 2, 3].map(async (level) => {
          const { data } = await supabase.rpc("team_members", { p_level: level });
          return data ?? [];
        }),
      );
      return results;
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ["team-commissions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("title, amount")
        .eq("kind", "income")
        .like("title", "%team commission%");
      return data ?? [];
    },
  });

  const rewardFor = (level: number) =>
    (commissions ?? [])
      .filter((row) => row.title.includes(`Level ${level}`))
      .reduce((sum, row) => sum + Number(row.amount), 0);

  const totalRewards = [1, 2, 3].reduce((sum, level) => sum + rewardFor(level), 0);
  const totalUsers = (levels ?? []).reduce((sum, list) => sum + list.length, 0);

  const inviteCode = profile?.invite_code ?? "------";
  const inviteLink = buildInviteLink(inviteCode);


  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      showPillToast(`${label} copied`);
    } catch {
      showPillToast("Copy failed, try again");
    }
  }

  return (
    <div className="slide-in min-h-dvh bg-background">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
        <h1 className="text-[34px] font-bold">Team</h1>
      </header>

      <section className="px-4">
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src={teamImage}
            alt="Oil mining field with drilling rigs at dusk"
            width={896}
            height={1152}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--night) 55%, transparent) 0%, color-mix(in oklab, var(--night) 25%, transparent) 45%, color-mix(in oklab, var(--night) 75%, transparent) 100%)",
            }}
          />
          <div className="relative flex min-h-[420px] flex-col justify-between p-5 text-night-foreground">
            <div className="flex items-start justify-between gap-4">
              <Link to="/team-records" className="press block min-w-0 text-left text-night-foreground">
                <p className="text-[22px] font-bold">{ugx(totalRewards)}</p>
                <p className="mt-1 text-[14px] opacity-90">Total rewards &gt;</p>
              </Link>
              <Link to="/team-records" className="press block min-w-0 text-right text-night-foreground">
                <p className="text-[22px] font-bold">{totalUsers}</p>
                <p className="mt-1 text-[14px] opacity-90">Total users &gt;</p>
              </Link>
            </div>


            <div>
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-[17px] font-bold">Invite Code</p>
                  <p className="mt-2 text-[28px] font-bold tracking-tight">{inviteCode}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[17px] font-bold">Invite Link</p>
                  <p className="mt-1 text-[12px] font-semibold break-all opacity-95">{inviteLink}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => copy(inviteCode, "Invite code")}
                  className="press rounded-full border border-night-foreground py-3 text-[15px] font-bold text-night-foreground"
                >
                  COPY
                </button>
                <button
                  type="button"
                  onClick={() => copy(inviteLink, "Invite link")}
                  className="press rounded-full bg-background py-3 text-[15px] font-bold text-foreground"
                >
                  COPY
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3 px-4">
        {LEVELS.map((row, index) => (
          <div
            key={row.level}
            className="flex items-center gap-4 rounded-2xl px-4 py-4"
            style={{ background: row.tint }}
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-[14px] font-medium text-muted-foreground">
              {row.level}
            </div>
            <div className="grid flex-1 grid-cols-3 text-center" style={{ color: row.text }}>
              <div>
                <p className="text-[22px] font-semibold">{row.commission}</p>
                <p className="text-[15px]">Commission</p>
              </div>
              <div>
                <p className="text-[22px] font-semibold">{levels?.[index]?.length ?? 0}</p>
                <p className="text-[15px]">Users</p>
              </div>
              <div>
                <p className="text-[22px] font-semibold">
                  {rewardFor(index + 1).toLocaleString("en-US")}
                </p>
                <p className="text-[15px]">Rewards</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-5 px-5 pb-28 text-[15px] leading-7">
        <p>
          When your invited friends register and buy their first product, you immediately receive a
          cash bonus of 15% of that first purchase amount.
        </p>
        <p>When your level 2 team members buy their first product, you receive a 3% cash bonus.</p>
        <p>When your level 3 team members buy their first product, you receive a 1% cash bonus.</p>
        <p>
          Once your team members invest, the cash bonus will be immediately deposited into your
          account balance and you can withdraw it immediately.
        </p>
      </section>
    </div>
  );
}
