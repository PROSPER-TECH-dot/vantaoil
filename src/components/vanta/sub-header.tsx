import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

export function SubHeader({ title, action }: { title: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="flex items-center gap-3 bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
      <button
        type="button"
        onClick={() => router.history.back()}
        aria-label="Go back"
        className="press -ml-1 p-1"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 5-7 7 7 7" />
        </svg>
      </button>
      <h1 className="flex-1 text-[22px] font-bold">{title}</h1>
      {action}
    </header>
  );
}

export function StarLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[19px] text-foreground/80">
      <span className="text-destructive">*</span> {children}
    </p>
  );
}

export function LineInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-3 w-full border-b border-border bg-transparent pb-2.5 text-[16px] outline-none placeholder:text-muted-foreground/80"
    />
  );
}

export function ConfirmButton({
  children = "Confirm",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      className="press mx-auto block w-[62%] rounded-full py-3.5 text-[19px] font-bold text-primary-foreground"
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}
    >
      {children}
    </button>
  );
}
