import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SubHeader } from "@/components/vanta/sub-header";
import { supabase } from "@/integrations/supabase/client";
import { formatStamp } from "@/lib/vanta";

export const Route = createFileRoute("/_authenticated/team-records")({
  head: () => ({
    meta: [
      { title: "Team Records — Vanta Oil" },
      { name: "description", content: "See your Vanta Oil level 1, 2 and 3 team members and their recharge totals." },
      { property: "og:title", content: "Team Records — Vanta Oil" },
      { property: "og:description", content: "See your Vanta Oil level 1, 2 and 3 team members and their recharge totals." },
    ],
  }),
  component: TeamRecordsPage,
});

const LEVELS = [1, 2, 3] as const;

function mask(phone: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return `**${digits.slice(-8)}`;
}

function TeamRecordsPage() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(1);

  const { data } = useQuery({
    queryKey: ["team-members", level],
    queryFn: async () => {
      const { data: rows } = await supabase.rpc("team_members", { p_level: level });
      return rows ?? [];
    },
  });

  const members = data ?? [];
  const recharge = members.reduce((sum, m) => sum + Number(m.recharge ?? 0), 0);

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Team Records" />

      <div className="bg-background">
        <div className="grid grid-cols-3 px-4">
          {LEVELS.map((item) => {
            const active = level === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                className={`press border border-border py-3 text-[15px] ${
                  active ? "bg-primary font-bold text-primary-foreground" : "bg-background text-muted-foreground"
                }`}
              >
                Level {item}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 px-4 py-4">
          <div className="border-r border-border text-center">
            <p className="text-[14px] text-muted-foreground">Team Members</p>
            <p className="mt-1 text-[20px] font-bold">{members.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-muted-foreground">Team Recharge</p>
            <p className="mt-1 text-[20px] font-bold">UGX {recharge.toLocaleString("en-US")}</p>
          </div>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-muted-foreground">No more data</p>
      ) : (
        <section className="space-y-3 px-4 py-4">
          {members.map((m) => (
            <div key={`${m.account}-${m.joined}`} className="flex items-center gap-3 rounded-2xl bg-background px-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8" r="3" />
                  <circle cx="16.5" cy="9" r="2.4" />
                  <path d="M3.5 19c.6-3 3-4.5 5.5-4.5S14 16 14.6 19M16 14.6c2 .3 3.7 1.7 4.2 4.4" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">Account: {mask(m.account)}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Date: {formatStamp(m.joined)}</p>
              </div>
              <p className="shrink-0 text-[15px] font-bold">
                UGX {Number(m.recharge ?? 0).toLocaleString("en-US")}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
