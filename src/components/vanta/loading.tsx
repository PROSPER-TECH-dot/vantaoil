import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";

type LoadingContextValue = {
  isLoading: boolean;
  startLoading: (duration?: number) => void;
};

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  startLoading: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

/** Vercel/iOS-style 12-spoke circular shimmer spinner. */
export function RingLoader({ size = 44 }: { size?: number }) {
  return (
    <span
      className="vanta-spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="vanta-spinner-bar"
          style={{
            transform: `rotate(${i * 30}deg) translateY(48%)`,
            animationDelay: `${(i - 12) * 0.1}s`,
          }}
        />

      ))}
    </span>
  );
}


export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback((duration = 1600) => {
    if (timer.current) clearTimeout(timer.current);
    setIsLoading(true);
    timer.current = setTimeout(() => setIsLoading(false), duration);
  }, []);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === null) {
      previous.current = pathname;
      return;
    }
    if (previous.current !== pathname) {
      previous.current = pathname;
      startLoading();
    }
  }, [pathname, startLoading]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading }}>
      {children}
      <div
        aria-hidden={!isLoading}
        className={`pointer-events-none fixed inset-0 z-[120] flex items-center justify-center backdrop-blur-[2px] transition-opacity duration-500 ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "color-mix(in oklab, var(--background) 78%, transparent)" }}
      >
        <RingLoader size={48} />
      </div>
    </LoadingContext.Provider>
  );
}
