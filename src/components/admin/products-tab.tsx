import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCenterToast } from "@/components/vanta/center-toast";
import { productImage, ugx } from "@/lib/vanta";
import { AdminCard, AdminInput, AdminModal, Empty, GhostButton, GoldButton, Pill } from "./ui";

type Product = {
  id: string;
  code: string;
  name: string;
  image: string;
  price: number;
  daily: number;
  term: string;
  total: number;
  sold_out: boolean;
  sort_order: number;
};

const BLANK = {
  code: "",
  name: "",
  image: "",
  price: "",
  daily: "",
  term: "",
  total: "",
  sort_order: "0",
};

export function ProductsTab() {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, image, price, daily, term, total, sold_out, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const toggleSoldOut = useMutation({
    mutationFn: async (row: Product) => {
      const { error } = await supabase.from("products").update({ sold_out: !row.sold_out }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      showCenterToast("Product updated");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  const remove = useMutation({
    mutationFn: async (row: Product) => {
      const { error } = await supabase.from("products").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      showCenterToast("Product deleted");
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  return (
    <div className="space-y-3">
      <GoldButton className="w-full" onClick={() => setEditing("new")}>
        + Create product
      </GoldButton>

      {!rows || rows.length === 0 ? (
        <Empty />
      ) : (
        rows.map((row) => (
          <AdminCard key={row.id}>
            <div className="flex items-start gap-3">
              <img
                src={productImage(row.image)}
                alt={row.name}
                width={768}
                height={576}
                loading="lazy"
                className="h-16 w-24 shrink-0 rounded-xl object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{row.name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {ugx(row.price)} · {ugx(row.daily)}/day · {row.term}
                </p>
                <div className="mt-1">
                  {row.sold_out ? <Pill tone="bad">Sold out</Pill> : <Pill tone="good">Buy now</Pill>}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <GhostButton onClick={() => setEditing(row)}>Edit</GhostButton>
              <GhostButton onClick={() => toggleSoldOut.mutate(row)}>
                {row.sold_out ? "Mark buy now" : "Mark sold out"}
              </GhostButton>
              <GhostButton className="text-destructive" onClick={() => remove.mutate(row)}>
                Delete
              </GhostButton>
            </div>
          </AdminCard>
        ))
      )}

      {editing ? (
        <ProductForm product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { showPillToast, showCenterToast } = useCenterToast();
  const [form, setForm] = useState(
    product
      ? {
          code: product.code,
          name: product.name,
          image: product.image,
          price: String(product.price),
          daily: String(product.daily),
          term: product.term,
          total: String(product.total),
          sort_order: String(product.sort_order),
        }
      : BLANK,
  );
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function uploadImage(file: File) {
    setUploading(true);
    const path = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      showPillToast(error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image: data.publicUrl }));
    setUploading(false);
    showCenterToast("Image uploaded");
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.name.trim()) throw new Error("Code and name are required");
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        image: form.image.trim(),
        price: Number(form.price || 0),
        daily: Number(form.daily || 0),
        term: form.term.trim(),
        total: Number(form.total || 0),
        sort_order: Number(form.sort_order || 0),
      };
      const { error } = product
        ? await supabase.from("products").update(payload).eq("id", product.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      showCenterToast(product ? "Product saved" : "Product created");
      onClose();
    },
    onError: (error: Error) => showPillToast(error.message),
  });

  return (
    <AdminModal title={product ? "Edit product" : "Create product"} onClose={onClose}>
      <div className="space-y-3">
        <AdminInput label="Code (unique)" value={form.code} onChange={set("code")} placeholder="vip11" />
        <AdminInput label="Name" value={form.name} onChange={set("name")} placeholder="VIP11 Vanta Rig" />

        {form.image ? (
          <img
            src={productImage(form.image)}
            alt="Product preview"
            width={768}
            height={576}
            loading="lazy"
            className="mx-auto h-28 w-auto object-contain"
          />
        ) : null}

        <AdminInput
          label="Image URL or bundled code (vip1 … vip10)"
          value={form.image}
          onChange={set("image")}
          placeholder="https://… or vip1"
        />
        <label className="block">
          <span className="mb-1 block text-[13px] text-muted-foreground">…or upload an image</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
            }}
            className="w-full text-[13px] text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-primary-foreground"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <AdminInput label="Price (UGX)" inputMode="numeric" value={form.price} onChange={set("price")} />
          <AdminInput label="Daily income" inputMode="numeric" value={form.daily} onChange={set("daily")} />
          <AdminInput label="Term" value={form.term} onChange={set("term")} placeholder="90 days" />
          <AdminInput label="Total income" inputMode="numeric" value={form.total} onChange={set("total")} />
          <AdminInput label="Sort order" inputMode="numeric" value={form.sort_order} onChange={set("sort_order")} />
        </div>

        <GoldButton className="w-full" disabled={save.isPending || uploading} onClick={() => save.mutate()}>
          {product ? "Save changes" : "Create product"}
        </GoldButton>
      </div>
    </AdminModal>
  );
}
