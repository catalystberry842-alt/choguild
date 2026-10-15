import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Wallet connection state without wagmi in the main bundle. The wagmi/viem runtime
 * (src/components/passport/wallet-runtime.tsx) loads after first paint, or immediately
 * when the user opens a wallet surface, and pushes its account state in here.
 */
export type WalletState = { address?: `0x${string}`; isConnected: boolean; chainId?: number };

type WalletContextValue = WalletState & {
  ready: boolean;
  setState: (state: WalletState) => void;
  load: () => void;
  loadRequested: boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const LazyBridge = lazy(() => import("./wallet-runtime").then((m) => ({ default: m.WalletBridge })));

export function WalletStateProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<WalletState>({ isConnected: false });
  const [ready, setReady] = useState(false);
  const [loadRequested, setLoadRequested] = useState(false);
  const setState = useCallback((next: WalletState) => {
    setReady(true);
    setStateRaw((prev) =>
      prev.address === next.address && prev.isConnected === next.isConnected && prev.chainId === next.chainId ? prev : next,
    );
  }, []);
  const load = useCallback(() => setLoadRequested(true), []);

  useEffect(() => {
    // Reconnect returning users soon after paint, without blocking it.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setLoadRequested(true), { timeout: 2500 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setLoadRequested(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  const value = useMemo(() => ({ ...state, ready, setState, load, loadRequested }), [state, ready, setState, load, loadRequested]);
  return (
    <WalletContext.Provider value={value}>
      {children}
      {loadRequested ? (
        <Suspense fallback={null}>
          <LazyBridge onChange={setState} />
        </Suspense>
      ) : null}
    </WalletContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWalletState() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWalletState must be used inside WalletStateProvider");
  return value;
}
