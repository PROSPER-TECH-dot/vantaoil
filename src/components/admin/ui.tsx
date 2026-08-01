import type { ReactNode } from "react";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-background p-4 shadow-[var(--shadow-soft)] ${className}`}>{children}</div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <AdminCard>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-[22px] font-bold">{value}</p>
      {hint ? <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p> : null}
    </AdminCard>
  );
}

export function AdminInput({
  label,
  ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-[13px] text-muted-foreground">{label}</span> : null}
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
      />
    </label>
  );
}

export function AdminSelect({
  label,
  children,
  ...props
}: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-[13px] text-muted-foreground">{label}</span> : null}
      <select
        {...props}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[15px] outline-none focus:border-primary"
      >
        {children}
      </select>
    </label>
  );
}

export function GoldButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`press rounded-full bg-primary px-5 py-2.5 text-[15px] font-bold text-primary-foreground disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`press rounded-full border border-border px-4 py-2 text-[14px] font-semibold disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ backgroundColor: "color-mix(in oklab, var(--night) 60%, transparent)" }}
      onClick={onClose}
    >
      <div
        className="fade-up max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[19px] font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="press p-1 text-muted-foreground">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ label = "No more data" }: { label?: string }) {
  return <p className="py-14 text-center text-[15px] text-muted-foreground">{label}</p>;
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 text-[14px] last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold">{value}</span>
    </div>
  );
}

export function Pill({ tone = "muted", children }: { tone?: "good" | "bad" | "muted"; children: ReactNode }) {
  const cls =
    tone === "good"
      ? "bg-primary/15 text-primary"
      : tone === "bad"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${cls}`}>{children}</span>;
}
