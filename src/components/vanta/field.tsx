import { useState, type InputHTMLAttributes, type ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  icon?: ReactNode;
  toggleable?: boolean;
};

export function Field({ label, error, icon, toggleable, id, type = "text", ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  const resolvedType = toggleable ? (visible ? "text" : "password") : type;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-foreground">
        {label}
      </label>
      <div
        className={`group flex items-center gap-2 rounded-2xl border bg-card px-3.5 transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 ${
          error ? "border-destructive" : "border-input"
        }`}
      >
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
        <input
          id={inputId}
          type={resolvedType}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
          aria-invalid={Boolean(error)}
          {...props}
        />
        {toggleable ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3" />
              {!visible ? <path d="m4 20 16-16" /> : null}
            </svg>
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-[12.5px] font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export function SubmitButton({
  children,
  loading,
  ...props
}: { children: ReactNode; loading?: boolean } & InputHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="press flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
      {...props}
    >
      {loading ? <span className="vanta-ring" style={{ width: 18, height: 18 }} /> : null}
      {children}
    </button>
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto w-full max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[1.9rem] leading-tight font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="surface-card fade-up mt-6 p-5">{children}</div>
        <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </main>
  );
}
