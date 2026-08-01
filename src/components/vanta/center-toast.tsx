import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type CenterToastContextValue = {
  showCenterToast: (message: string, duration?: number) => void;
  showPillToast: (message: string, duration?: number) => void;
};

const CenterToastContext = createContext<CenterToastContextValue>({
  showCenterToast: () => {},
  showPillToast: () => {},
});

export function useCenterToast() {
  return useContext(CenterToastContext);
}

export function CenterToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pill, setPill] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCenterToast = useCallback((next: string, duration = 1800) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), duration);
  }, []);

  const showPillToast = useCallback((next: string, duration = 2000) => {
    if (pillTimer.current) clearTimeout(pillTimer.current);
    setPill(next);
    pillTimer.current = setTimeout(() => setPill(null), duration);
  }, []);

  return (
    <CenterToastContext.Provider value={{ showCenterToast, showPillToast }}>
      {children}
      {message ? (
        <div
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-8"
          role="status"
          aria-live="polite"
        >
          <div
            className="center-toast flex items-center gap-2 rounded-none px-4 py-2 text-night-foreground"
            style={{ backgroundColor: "color-mix(in oklab, var(--night) 88%, transparent)" }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="m4 12.5 5.2 5.5L20 6" />
            </svg>
            <p className="text-center text-[13px] font-medium">{message}</p>
          </div>
        </div>
      ) : null}
      {pill ? (
        <div
          className="pointer-events-none fixed inset-0 z-[210] flex items-center justify-center px-8"
          role="status"
          aria-live="polite"
        >
          <div
            className="pill-toast rounded-none px-4 py-2 text-center text-[13px] text-night-foreground"
            style={{ backgroundColor: "color-mix(in oklab, var(--night) 88%, transparent)" }}
          >
            {pill}
          </div>
        </div>
      ) : null}
    </CenterToastContext.Provider>
  );
}
