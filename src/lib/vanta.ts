import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const CHECKIN_BONUS = 300;
export const MIN_RECHARGE = 20000;
export const MIN_WITHDRAWAL = 5000;
export const WELCOME_BONUS = 4000;
export const WITHDRAWAL_FEE_PERCENT = 20;

export const ugx = (value: number) => `UGX ${Math.abs(value).toLocaleString("en-US")}`;

export function formatStamp(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name, email, phone, balance, recharge_balance, cumulative_income, withdrawn, invite_code, checkin_days, last_checkin_date, products_count",
        )
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });
}

/** Creates the profile row, invite code, referral link and welcome bonus. Safe to call repeatedly. */
export async function setupAccount(phone: string, inviteCode?: string) {
  const code = inviteCode?.trim();
  await supabase.rpc("setup_account", code ? { p_phone: phone, p_invite: code } : { p_phone: phone });
}

export function inviteLink(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://vantaoil.lovable.app";
  return `${origin}/register?code=${code}`;
}
