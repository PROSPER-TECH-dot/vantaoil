import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ConfirmButton, LineInput, StarLabel, SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/change-password")({
  head: () => ({
    meta: [
      { title: "Change Password — Vanta Oil" },
      { name: "description", content: "Update the password that protects your Vanta Oil account." },
      { property: "og:title", content: "Change Password — Vanta Oil" },
      { property: "og:description", content: "Update the password that protects your Vanta Oil account." },
    ],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { showPillToast, showCenterToast } = useCenterToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return showPillToast("Please enter current password");
    if (next.length < 6) return showPillToast("New password must be at least 6 characters");
    if (next !== confirm) return showPillToast("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return showPillToast(error.message);
    setCurrent("");
    setNext("");
    setConfirm("");
    showCenterToast("Password changed successfully");
  }

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Change Password" />

      <form onSubmit={submit} className="px-4 pt-4">
        <div className="rounded-3xl bg-background px-6 py-8">
          <StarLabel>Current Password</StarLabel>
          <LineInput
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Please enter current password"
          />

          <div className="mt-9">
            <StarLabel>New Password</StarLabel>
            <LineInput
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Please enter new password"
            />
          </div>

          <div className="mt-9">
            <StarLabel>Confirm New Password</StarLabel>
            <LineInput
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Please confirm new password"
            />
          </div>
        </div>

        <div className="py-7">
          <ConfirmButton disabled={busy}>Confirm</ConfirmButton>
        </div>
      </form>
    </div>
  );
}
