import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, SkeletonBlock, EmptyState } from "@/components/vanta/ui";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — Vanta Oil" },
      { name: "description", content: "Your Vanta Oil team and referral overview." },
      { property: "og:title", content: "Team — Vanta Oil" },
      { property: "og:description", content: "Your Vanta Oil team and referral overview." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <div className="slide-in">
      <PageHeader title="Team" subtitle="Referrals and network overview" />
      <div className="space-y-4 px-5">
        <div className="grid grid-cols-3 gap-3">
          {["Members", "Active", "Rewards"].map((label) => (
            <Panel key={label} className="p-4 text-center">
              <SkeletonBlock className="mx-auto h-6 w-10" />
              <p className="mt-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
              </p>
            </Panel>
          ))}
        </div>

        <Panel title="Your invitation">
          <SkeletonBlock className="h-11 w-full" />
        </Panel>

        <Panel title="Team members">
          <EmptyState
            title="No members yet"
            description="Invite people to Vanta Oil and your network will be listed here."
          />
        </Panel>
      </div>
    </div>
  );
}
