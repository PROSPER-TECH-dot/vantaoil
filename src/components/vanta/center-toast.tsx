import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type CenterToastContextValue = {
  showCenterToast: (message: string, duration?: number) => void;
};

const CenterToastContext = createContext<CenterToastContextValue>({
  showCenterToast: () => {},
});

export function useCenterToast() {
  return useContext(CenterToastContext);
}

export function CenterToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCenterToast = useCallback((next: string, duration = 1800) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), duration);
  }, []);

  return (
    <CenterToastContext.Provider value={{ showCenterToast }}>
      {children}
      {message ? (
        <div
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-8"
          role="status"
          aria-live="polite"
        >
          <div
            className="center-toast flex min-w-[190px] flex-col items-center gap-2 rounded-xl px-7 py-5 text-night-foreground"
            style={{ backgroundColor: "color-mix(in oklab, var(--night) 78%, transparent)" }}
          >
            <svg
              viewBox="0 0 24 24"
              width="42"
              height="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m4 12.5 5.2 5.5L20 6" />
            </svg>
            <p className="text-center text-[17px] font-medium">{message}</p>
          </div>
        </div>
      ) : null}
    </CenterToastContext.Provider>
  );
}
