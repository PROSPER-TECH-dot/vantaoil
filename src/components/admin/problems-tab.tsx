import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import { formatStamp, ugx } from "@/lib/vanta";
import { AdminCard, Empty, GhostButton, GoldButton, KV } from "./ui";

type Problem = {
  id: string;
  user_id: string;
  wallet: string;
  amount: number;
  certificate_url: string | null;
  seen: boolean;
  created_at: string;
};

export function ProblemsTab() {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const [preview, setPreview] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin", "problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_problems")
        .select("id, user_id, wallet, amount, certificate_url, seen, created_at")
        .eq("seen", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Problem[];
    },
  });

  const { data: people } = useQuery({
    queryKey: ["admin", "user-index"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, phone, email, full_name").limit(1000);
      const map = new Map<string, string>();
      for (const row of data ?? []) map.set(row.id, row.phone || row.email || row.full_name || row.id.slice(0, 8));
      return map;
    },
  });

  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recharge_problems").update({ seen: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      showCenterToast("Marked as seen");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  async function openCertificate(url: string) {
    if (/^https?:\/\//.test(url)) {
      setPreview(url);
      return;
    }
    const { data, error } = await supabase.storage.from("certificates").createSignedUrl(url, 300);
    if (error || !data) {
      showPillToast(error?.message ?? "Could not open certificate");
      return;
    }
    setPreview(data.signedUrl);
  }

  return (
    <div className="space-y-3">
      {!rows || rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((row) => (
          <AdminCard key={row.id}>
            <KV label="Member" value={people?.get(row.user_id) ?? row.user_id.slice(0, 8)} />
            <KV label="Wallet used" value={row.wallet} />
            <KV label="Amount" value={ugx(row.amount)} />
            <KV label="Submitted" value={formatStamp(row.created_at)} />
            <div className="mt-3 flex flex-wrap gap-2">
              {row.certificate_url ? (
                <GhostButton onClick={() => void openCertificate(row.certificate_url as string)}>
                  View certificate
                </GhostButton>
              ) : null}
              <GoldButton onClick={() => markSeen.mutate(row.id)}>Seen</GoldButton>
            </div>
          </AdminCard>
        ))
      )}

      {preview ? (
        <button
          type="button"
          aria-label="Close certificate"
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
        >
          <img src={preview} alt="Recharge certificate" className="max-h-full w-auto max-w-full object-contain" />
        </button>
      ) : null}
    </div>
  );
}
