import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { ugx, useProfile } from "@/lib/vanta";
import { useCenterToast } from "@/components/vanta/center-toast";
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

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Products — Vanta Oil" },
      { name: "description", content: "Browse Vanta Oil energy investment products and daily income plans." },
      { property: "og:title", content: "Products — Vanta Oil" },
      {
        property: "og:description",
        content: "Browse Vanta Oil energy investment products and daily income plans.",
      },
    ],
  }),
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  term: string;
  daily: number;
  total: number;
};

const products: Product[] = [
  {
    id: "vip1",
    name: "VIP1 Vanta Pump Jack",
    image: vip1,
    price: 10000,
    term: "365-day",
    daily: 2400,
    total: 876000,
  },
  {
    id: "vip2",
    name: "VIP2 Vanta Storage Tank",
    image: vip2,
    price: 15000,
    term: "210 days",
    daily: 3750,
    total: 787500,
  },
  {
    id: "vip3",
    name: "VIP3 Vanta Offshore Rig",
    image: vip3,
    price: 30000,
    term: "180 days",
    daily: 8200,
    total: 1476000,
  },
  {
    id: "vip4",
    name: "VIP4 Vanta Refinery Tower",
    image: vip4,
    price: 60000,
    term: "150 days",
    daily: 17000,
    total: 2550000,
  },
  {
    id: "vip5",
    name: "VIP5 Vanta Tanker Fleet",
    image: vip5,
    price: 120000,
    term: "150 days",
    daily: 35000,
    total: 5250000,
  },
  {
    id: "vip6",
    name: "VIP6 Vanta Drilling Derrick",
    image: vip6,
    price: 250000,
    term: "120 days",
    daily: 78000,
    total: 9360000,
  },
  {
    id: "vip7",
    name: "VIP7 Vanta Pumping Station",
    image: vip7,
    price: 400000,
    term: "120 days",
    daily: 128000,
    total: 15360000,
  },
  {
    id: "vip8",
    name: "VIP8 Vanta Tank Farm",
    image: vip8,
    price: 700000,
    term: "100 days",
    daily: 231000,
    total: 23100000,
  },
  {
    id: "vip9",
    name: "VIP9 Vanta Offshore Platform",
    image: vip9,
    price: 1200000,
    term: "90 days",
    daily: 420000,
    total: 37800000,
  },
  {
    id: "vip10",
    name: "VIP10 Vanta Gas Compressor",
    image: vip10,
    price: 2000000,
    term: "90 days",
    daily: 720000,
    total: 64800000,
  },
];

function ProductsPage() {
  const [pending, setPending] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const { data: profile } = useProfile();

  const { data: owned } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data } = await supabase.from("purchases").select("id, total");
      return data ?? [];
    },
  });

  const revenue = (owned ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);

  async function confirmPurchase(product: Product) {
    setPending(null);
    const { error } = await supabase.rpc("purchase_product", {
      p_product_id: product.id,
      p_name: product.name,
      p_image: product.image,
      p_price: product.price,
      p_daily: product.daily,
      p_term: product.term,
      p_total: product.total,
    });
    if (error) {
      showPillToast(error.message);
      return;
    }
    await queryClient.invalidateQueries();
    showCenterToast("Purchase successful");
  }

  return (
    <div className="slide-in min-h-dvh bg-surface pb-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-5">
        <h1 className="truncate text-3xl font-bold">Product</h1>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-background text-[13px] font-bold tracking-tight">
          VANTA
        </span>
      </header>

      <section className="px-4">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-7"
          style={{ background: "var(--gradient-charcoal)" }}
        >
          <div className="flex items-end justify-between text-charcoal-foreground">
            <Link to="/my-products" className="press block text-left">
              <p className="text-3xl font-bold">{owned?.length ?? 0}</p>
              <p className="mt-1 text-[15px] opacity-90">My Product &gt;</p>
            </Link>
            <Link to="/my-products" className="press block text-right">
              <p className="text-3xl font-bold">{ugx(revenue)}</p>
              <p className="mt-1 text-[15px] opacity-90">Total revenue &gt;</p>
            </Link>
          </div>
          <p className="mt-4 text-[14px] text-charcoal-foreground/80">
            Purchase balance: {ugx(profile?.recharge_balance ?? 0)}
          </p>
        </div>
      </section>

      <section className="mt-4 space-y-4 px-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl bg-background p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-center text-[19px] font-semibold">{product.name}</h2>
            <img
              src={product.image}
              alt={product.name}
              width={768}
              height={576}
              loading="lazy"
              className="mx-auto my-4 h-40 w-auto object-contain"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[22px] font-bold text-primary">{ugx(product.price)}</p>
              <button
                type="button"
                onClick={() => setPending(product)}
                className="press rounded-full bg-primary px-7 py-3 text-[16px] font-bold text-primary-foreground"
              >
                BUY NOW
              </button>
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-[15px]">
              <Row label="Term:" value={product.term} />
              <Row label="Daily income:" value={ugx(product.daily)} />
              <Row label="Total income:" value={ugx(product.total)} />
            </div>
          </article>
        ))}
      </section>

      {pending ? (
        <PurchaseDialog
          product={pending}
          onClose={() => setPending(null)}
          onConfirm={() => confirmPurchase(pending)}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PurchaseDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Purchase ${product.name}`}
      style={{ backgroundColor: "color-mix(in oklab, var(--night) 55%, transparent)" }}
      onClick={onClose}
    >
      <div
        className="fade-up w-full max-w-sm rounded-3xl bg-background p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <img
            src={product.image}
            alt={product.name}
            width={768}
            height={576}
            loading="lazy"
            className="h-16 w-24 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold">{product.name}</p>
            <p className="mt-1 text-[19px] font-bold text-primary">{ugx(product.price)}</p>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        <p className="text-center text-[15px] text-muted-foreground">Income settled every 24h</p>
        <p className="mt-1 text-center text-[14px] text-muted-foreground">
          You can buy multiple devices to increase your income
        </p>

        <div className="mt-4 space-y-2 text-[15px]">
          <Row label="Term:" value={product.term} />
          <Row label="Daily income:" value={ugx(product.daily)} />
          <Row label="Total income:" value={ugx(product.total)} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="press rounded-full bg-secondary py-3.5 text-[17px] font-semibold text-muted-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="press rounded-full bg-primary py-3.5 text-[17px] font-bold text-primary-foreground"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
