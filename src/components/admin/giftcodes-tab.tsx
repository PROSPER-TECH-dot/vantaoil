import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import { formatStamp, ugx } from "@/lib/vanta";
import { AdminCard, AdminInput, AdminSelect, Empty, GhostButton, GoldButton, KV, Pill } from "./ui";

type Code = {
  id: string;
  code: string;
  mode: string;
  amount: number;
  min_amount: number;
  max_amount: number;
  max_redemptions: number;
  redeemed_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
};

const UNITS: Record<string, number> = { seconds: 1000, minutes: 60_000, hours: 3_600_000, days: 86_400_000 };

export function GiftCodesTab() {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();

  const [code, setCode] = useState("");
  const [mode, setMode] = useState("fixed");
  const [amount, setAmount] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [expiryValue, setExpiryValue] = useState("");
  const [expiryUnit, setExpiryUnit] = useState("minutes");

  const { data: rows } = useQuery({
    queryKey: ["admin", "giftcodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_codes")
        .select(
          "id, code, mode, amount, min_amount, max_amount, max_redemptions, redeemed_count, expires_at, active, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Code[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const name = code.trim().toUpperCase();
      if (!name) throw new Error("Enter a code name");
      if (mode === "fixed" && Number(amount) <= 0) throw new Error("Enter a fixed amount");
      if (mode === "random" && Number(minAmount) >= Number(maxAmount))
        throw new Error("Random range must be low to high");
      const expiresAt = expiryValue.trim()
        ? new Date(Date.now() + Number(expiryValue) * UNITS[expiryUnit]).toISOString()
        : null;
      const { error } = await supabase.from("gift_codes").insert({
        code: name,
        mode,
        amount: mode === "fixed" ? Number(amount || 0) : 0,
        min_amount: mode === "random" ? Number(minAmount || 0) : 0,
        max_amount: mode === "random" ? Number(maxAmount || 0) : 0,
        max_redemptions: Math.max(1, Number(maxRedemptions || 1)),
        expires_at: expiresAt,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setCode("");
      setAmount("");
      setMinAmount("");
      setMaxAmount("");
      setExpiryValue("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "giftcodes"] });
      showCenterToast("Gift code created");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (row: Code) => {
      const { error } = await supabase.from("gift_codes").update({ active: !row.active }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "giftcodes"] });
      showCenterToast("Gift code updated");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  const remove = useMutation({
    mutationFn: async (row: Code) => {
      const { error } = await supabase.from("gift_codes").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "giftcodes"] });
      showCenterToast("Gift code deleted");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  return (
    <div className="space-y-4">
      <AdminCard>
        <h2 className="mb-3 text-[15px] font-bold">Create gift code</h2>
        <div className="space-y-3">
          <AdminInput
            label="Code name"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VANTA500"
          />
          <AdminSelect label="Type" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="fixed">Fixed amount</option>
            <option value="random">Random amount</option>
          </AdminSelect>

          {mode === "fixed" ? (
            <AdminInput
              label="Amount (UGX)"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="500"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <AdminInput
                label="Minimum"
                inputMode="numeric"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="100"
              />
              <AdminInput
                label="Maximum"
                inputMode="numeric"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="500"
              />
            </div>
          )}

          <AdminInput
            label="Number of users who can redeem"
            inputMode="numeric"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value.replace(/\D/g, ""))}
          />

          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label="Expires in (optional)"
              inputMode="numeric"
              value={expiryValue}
              onChange={(e) => setExpiryValue(e.target.value.replace(/\D/g, ""))}
              placeholder="Leave empty for never"
            />
            <AdminSelect label="Unit" value={expiryUnit} onChange={(e) => setExpiryUnit(e.target.value)}>
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </AdminSelect>
          </div>

          <GoldButton className="w-full" disabled={create.isPending} onClick={() => create.mutate()}>
            Create gift code
          </GoldButton>
        </div>
      </AdminCard>

      {!rows || rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((row) => {
          const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
          return (
            <AdminCard key={row.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-[17px] font-bold tracking-wide">{row.code}</p>
                {expired ? (
                  <Pill tone="bad">Expired</Pill>
                ) : row.active ? (
                  <Pill tone="good">Active</Pill>
                ) : (
                  <Pill tone="bad">Inactive</Pill>
                )}
              </div>
              <KV
                label="Reward"
                value={row.mode === "fixed" ? ugx(row.amount) : `${ugx(row.min_amount)} – ${ugx(row.max_amount)}`}
              />
              <KV label="Redeemed" value={`${row.redeemed_count} / ${row.max_redemptions}`} />
              <KV label="Expires" value={row.expires_at ? formatStamp(row.expires_at) : "Never"} />
              <div className="mt-3 flex flex-wrap gap-2">
                <GhostButton onClick={() => toggle.mutate(row)}>{row.active ? "Deactivate" : "Activate"}</GhostButton>
                <GhostButton className="text-destructive" onClick={() => remove.mutate(row)}>
                  Delete
                </GhostButton>
              </div>
            </AdminCard>
          );
        })
      )}
    </div>
  );
}
