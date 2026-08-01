import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";

import { supabase } from "@/integrations/supabase/client";
import { productImage, ugx, useProfile } from "@/lib/vanta";
import { useCenterToast } from "@/components/vanta/center-toast";

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
  sold_out: boolean;
};

function ProductsPage() {
  const [pending, setPending] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const { data: profile } = useProfile();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, image, price, daily, term, total, sold_out")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.code,
        name: row.name,
        image: row.image,
        price: Number(row.price),
        daily: Number(row.daily),
        term: row.term,
        total: Number(row.total),
        sold_out: row.sold_out,
      })) as Product[];
    },
  });

  const { data: owned } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data } = await supabase.from("purchases").select("id, total");
      return data ?? [];
    },
  });

  const revenue = (owned ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const available = revenue + Number(profile?.recharge_balance ?? 0);

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
              <p className="text-3xl font-bold">{ugx(available)}</p>
              <p className="mt-1 text-[15px] opacity-90">Total revenue &gt;</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-4 px-4">
        {(products ?? []).map((product) => (
          <article key={product.id} className="rounded-3xl bg-background p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-center text-[19px] font-semibold">{product.name}</h2>
            <img
              src={productImage(product.image)}
              alt={product.name}
              width={768}
              height={576}
              loading="lazy"
              className={`mx-auto my-4 h-40 w-auto object-contain ${product.sold_out ? "opacity-50 grayscale" : ""}`}
            />
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[22px] font-bold ${product.sold_out ? "text-muted-foreground" : "text-primary"}`}>
                {ugx(product.price)}
              </p>
              <button
                type="button"
                disabled={product.sold_out}
                onClick={() => setPending(product)}
                className={`rounded-full px-7 py-3 text-[16px] font-bold ${
                  product.sold_out
                    ? "cursor-not-allowed bg-secondary text-muted-foreground"
                    : "press bg-primary text-primary-foreground"
                }`}
              >
                {product.sold_out ? "SOLD OUT" : "BUY NOW"}
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

function PurchaseDialog(props: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(<PurchaseDialogBody {...props} />, document.body);
}

function PurchaseDialogBody({
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
