import { lazy, Suspense, useEffect } from "react";
import { useWalletState } from "@/components/passport/wallet-state";

const Panel = lazy(() => import("./wallet-runtime").then((m) => ({ default: m.WalletPanel })));

function PanelSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading wallet options">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton h-11 w-full rounded-full" />
      <div className="skeleton h-11 w-full rounded-full" />
    </div>
  );
}

/** Wallet panel that pulls in the wallet stack only when shown. */
export function LazyWalletPanel() {
  const { load } = useWalletState();
  useEffect(() => load(), [load]);
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Panel />
    </Suspense>
  );
}
