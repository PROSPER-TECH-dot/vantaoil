import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import vip1 from "@/assets/product-vip1.jpg";
import vip2 from "@/assets/product-vip2.jpg";
import vip3 from "@/assets/product-vip3.jpg";
import vip4 from "@/assets/product-vip4.jpg";
import vip5 from "@/assets/product-vip5.jpg";
import vip6 from "@/assets/product-vip6.jpg";
import vip7 from "@/assets/product-vip7.jpg";
import vip8 from "@/assets/product-vip8.jpg";
import vip9 from "@/assets/product-vip9.jpg";
import vip10 from "@/assets/product-vip10.jpg";

export const ugx = (value: number) =>
  `UGX ${Math.abs(Number(value) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function formatStamp(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ */
/* Product images                                                      */
/* ------------------------------------------------------------------ */

const BUNDLED: Record<string, string> = {
  vip1, vip2, vip3, vip4, vip5, vip6, vip7, vip8, vip9, vip10,
};

/** Bundled asset codes resolve to the imported file; anything else is treated as a URL. */
export function productImage(image: string | null | undefined) {
  if (!image) return vip1;
  return BUNDLED[image] ?? image;
}

/* ------------------------------------------------------------------ */
/* Platform settings (admin editable)                                  */
/* ------------------------------------------------------------------ */

export type Settings = {
  min_recharge: number;
  min_withdrawal: number;
  withdrawal_fee_percent: number;
  welcome_bonus: number;
  checkin_bonus: number;
  support_whatsapp: string;
  support_whatsapp_2: string;
  group_link: string;
};

export const SETTING_DEFAULTS: Settings = {
  min_recharge: 20000,
  min_withdrawal: 5000,
  withdrawal_fee_percent: 20,
  welcome_bonus: 4000,
  checkin_bonus: 300,
  support_whatsapp: "",
  support_whatsapp_2: "",
  group_link: "",
};

export const NUMERIC_SETTINGS = [
  "min_recharge",
  "min_withdrawal",
  "withdrawal_fee_percent",
  "welcome_bonus",
  "checkin_bonus",
] as const;

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["app_settings"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const merged = { ...SETTING_DEFAULTS } as Record<string, string | number>;
      for (const row of data ?? []) {
        merged[row.key] = (NUMERIC_SETTINGS as readonly string[]).includes(row.key)
          ? Number(row.value)
          : row.value;
      }
      return merged as unknown as Settings;
    },
  });
}

/** Always returns usable values — falls back to defaults while loading. */
export function useSettings(): Settings {
  const { data } = useSettingsQuery();
  return data ?? SETTING_DEFAULTS;
}

/* ------------------------------------------------------------------ */
/* Profile + roles                                                     */
/* ------------------------------------------------------------------ */

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
          "id, full_name, email, phone, avatar_url, balance, recharge_balance, cumulative_income, withdrawn, invite_code, checkin_days, last_checkin_date, products_count, banned",
        )
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
  });
}

/** Credits any daily income that became due (24h cycles from purchase time). */
export function useSettleIncome() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("settle_income");
      if (!cancelled && Number(data ?? 0) > 0) await queryClient.invalidateQueries();
    })();
    const timer = setInterval(async () => {
      const { data } = await supabase.rpc("settle_income");
      if (Number(data ?? 0) > 0) await queryClient.invalidateQueries();
    }, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [queryClient]);
}

export function useIsAdmin() {
  const { data } = useQuery({
    queryKey: ["is_admin"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return Boolean(data);
    },
  });
  return data ?? false;
}

/* ------------------------------------------------------------------ */
/* Account setup                                                       */
/* ------------------------------------------------------------------ */

/** Creates the profile row, invite code, referral link and welcome bonus. Safe to call repeatedly. */
export async function setupAccount(phone: string, inviteCode?: string) {
  const code = inviteCode?.trim();
  await supabase.rpc("setup_account", code ? { p_phone: phone, p_invite: code } : { p_phone: phone });
}

export function inviteLink(code: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://vantaoil.lovable.app";
  return `${origin}/register?code=${code}`;
}
