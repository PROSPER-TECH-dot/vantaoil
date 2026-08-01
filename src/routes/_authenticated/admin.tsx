import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { GiftCodesTab } from "@/components/admin/giftcodes-tab";
import { OverviewTab } from "@/components/admin/overview-tab";
import { ProblemsTab } from "@/components/admin/problems-tab";
import { ProductsTab } from "@/components/admin/products-tab";
import { SettingsTab } from "@/components/admin/settings-tab";
import { TransactionsTab } from "@/components/admin/transactions-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { useIsAdmin } from "@/lib/vanta";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Vanta Oil" },
      { name: "description", content: "Manage Vanta Oil members, products, transactions and platform settings." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Panel — Vanta Oil" },
      { property: "og:description", content: "Vanta Oil platform administration." },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "products", label: "Products" },
  { id: "transactions", label: "Transactions" },
  { id: "problems", label: "Recharge problem" },
  { id: "giftcode", label: "Giftcode" },
  { id: "settings", label: "Settings" },
] as const;

function AdminPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-[18px] font-bold">Access denied</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">This area is for platform administrators only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate({ to: "/mine" })}
            className="press text-[20px] leading-none"
          >
            ‹
          </button>
          <h1 className="text-[17px] font-bold">Admin Panel</h1>
        </div>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`press whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-4 py-4">
        {tab === "overview" ? <OverviewTab /> : null}
        {tab === "users" ? <UsersTab /> : null}
        {tab === "products" ? <ProductsTab /> : null}
        {tab === "transactions" ? <TransactionsTab /> : null}
        {tab === "problems" ? <ProblemsTab /> : null}
        {tab === "giftcode" ? <GiftCodesTab /> : null}
        {tab === "settings" ? <SettingsTab /> : null}
      </main>
    </div>
  );
}
