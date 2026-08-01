import { useState, type InputHTMLAttributes, type ReactNode } from "react";

export function PillInput({
  prefix,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { prefix?: string; error?: string | undefined }) {
  return (
    <div>
      <div
        className={`flex items-center rounded-full border bg-transparent px-6 ${
          error ? "border-destructive" : "border-night-input"
        }`}
      >
        {prefix ? (
          <span className="mr-4 shrink-0 text-[17px] text-night-foreground/45">{prefix}</span>
        ) : null}
        <input
          className="min-w-0 flex-1 bg-transparent py-4 text-[17px] text-night-foreground outline-none placeholder:text-night-foreground/45"
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 pl-6 text-[13px] font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

export function PillButton({
  children,
  loading,
  ...props
}: { children: ReactNode; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="press flex w-full items-center justify-center gap-2 rounded-full bg-night-foreground py-4 text-[17px] font-bold text-night disabled:opacity-70"
      {...props}
    >
      {loading ? (
        <span
          className="vanta-ring"
          style={{ width: 18, height: 18, borderTopColor: "var(--night)" }}
        />
      ) : null}
      {children}
    </button>
  );
}

export function PasswordInput(
  props: InputHTMLAttributes<HTMLInputElement> & { error?: string | undefined },
) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div
        className={`flex items-center rounded-full border bg-transparent px-6 ${
          props.error ? "border-destructive" : "border-night-input"
        }`}
      >
        <input
          {...props}
          type={visible ? "text" : "password"}
          className="min-w-0 flex-1 bg-transparent py-4 text-[17px] text-night-foreground outline-none placeholder:text-night-foreground/45"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 pl-3 text-night-foreground/45"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
            {!visible ? <path d="m4 20 16-16" /> : null}
          </svg>
        </button>
      </div>
      {props.error ? (
        <p className="mt-1.5 pl-6 text-[13px] font-medium text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}
