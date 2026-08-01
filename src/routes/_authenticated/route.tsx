import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav, NAV_PATHS } from "@/components/vanta/bottom-nav";
import { useSettleIncome } from "@/lib/vanta";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AppLayout,
});

function AppLayout() {
  useSettleIncome();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showNav = (NAV_PATHS as readonly string[]).includes(pathname);

  return (
    <div className="min-h-dvh bg-background">
      <div className={`mx-auto w-full max-w-md ${showNav ? "pb-24" : ""}`}>
        <Outlet />
      </div>
      {showNav ? <BottomNav /> : null}
    </div>
  );
}
