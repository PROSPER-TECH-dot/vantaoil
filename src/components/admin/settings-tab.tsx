import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import { AdminCard, AdminInput, GoldButton } from "./ui";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "min_recharge", label: "Minimum deposit (UGX)" },
  { key: "min_withdrawal", label: "Minimum withdrawal (UGX)" },
  { key: "withdrawal_fee_percent", label: "Withdrawal fee (%)" },
  { key: "welcome_bonus", label: "Welcome bonus (UGX)" },
  { key: "checkin_bonus", label: "Daily check-in bonus (UGX)" },
  { key: "support_whatsapp", label: "WhatsApp number 1" },
  { key: "support_whatsapp_2", label: "WhatsApp number 2" },
  { key: "group_link", label: "WhatsApp group link" },
];

export function SettingsTab() {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
  });

  useEffect(() => {
    if (data) setForm((f) => ({ ...data, ...f }));
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = FIELDS.map((f) => ({ key: f.key, value: (form[f.key] ?? "").trim(), updated_at: new Date().toISOString() }));
      const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      showCenterToast("Settings saved");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  return (
    <AdminCard>
      <div className="space-y-3">
        {FIELDS.map((field) => (
          <AdminInput
            key={field.key}
            label={field.label}
            value={form[field.key] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
          />
        ))}
        <GoldButton className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
          Save settings
        </GoldButton>
        <p className="text-[12px] text-muted-foreground">
          Changes apply across the whole app immediately — deposit and withdrawal limits, fees, bonuses and support
          contacts all read from here.
        </p>
      </div>
    </AdminCard>
  );
}
