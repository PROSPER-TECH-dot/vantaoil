import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, SkeletonBlock } from "@/components/vanta/ui";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export const Route = createFileRoute("/_authenticated/mine")({
  head: () => ({
    meta: [
      { title: "My account — Vanta Oil" },
      { name: "description", content: "Manage your Vanta Oil profile and account settings." },
      { property: "og:title", content: "My account — Vanta Oil" },
      { property: "og:description", content: "Manage your Vanta Oil profile and account settings." },
    ],
  }),
  component: MinePage,
});

function MinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
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
    toast.success("Signed out", { description: "See you soon." });
    navigate({ to: "/login", replace: true });
  }

  const initials =
    profile?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VO";

  const rows = [
    { label: "Security", hint: "Password and sign-in" },
    { label: "Payment methods", hint: "Coming soon" },
    { label: "Documents", hint: "Statements and reports" },
    { label: "Support", hint: "Contact the Vanta team" },
  ];

  return (
    <div className="slide-in">
      <PageHeader title="Mine" subtitle="Profile and account settings" />
      <div className="space-y-4 px-5">
        <Panel>
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-charcoal text-lg font-semibold text-charcoal-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              {isLoading ? (
                <>
                  <SkeletonBlock className="h-5 w-32" />
                  <SkeletonBlock className="mt-2 h-3.5 w-40" />
                </>
              ) : (
                <>
                  <p className="truncate text-base font-semibold">
                    {profile?.full_name || "Vanta investor"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="press shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-semibold"
            >
              Details
            </button>
          </div>
        </Panel>

        <Panel title="Account">
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.label}>
                <button
                  type="button"
                  onClick={() => toast("Coming soon", { description: `${row.label} is on the way.` })}
                  className="press flex w-full items-center justify-between gap-3 py-3.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{row.label}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {row.hint}
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0 text-muted-foreground" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <button
          type="button"
          onClick={handleSignOut}
          className="press w-full rounded-2xl border border-border bg-card py-4 text-[15px] font-semibold text-destructive"
        >
          Sign out
        </button>
      </div>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader className="text-left">
            <DrawerTitle>Account details</DrawerTitle>
            <DrawerDescription>The information linked to your Vanta Oil account.</DrawerDescription>
          </DrawerHeader>
          <dl className="space-y-3 px-4 pb-8 text-sm">
            {[
              ["Full name", profile?.full_name],
              ["Email", profile?.email],
              ["Phone", profile?.phone],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 truncate font-medium">{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
