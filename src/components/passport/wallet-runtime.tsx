import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { useAccount, WagmiProvider } from "wagmi";
import { WalletPanel as WalletPanelInner } from "@/components/passport/wallet-panel";
import { wagmiConfig } from "@/lib/passport/wagmi";
import type { WalletState } from "@/components/passport/wallet-state";

const queryClient = new QueryClient();

function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

function Bridge({ onChange }: { onChange: (state: WalletState) => void }) {
  const { address, isConnected, chainId } = useAccount();
  useEffect(() => onChange({ address, isConnected, chainId }), [address, isConnected, chainId, onChange]);
  return null;
}

/** Mirrors wagmi's account into the lightweight wallet context. */
export function WalletBridge({ onChange }: { onChange: (state: WalletState) => void }) {
  return (
    <Providers>
      <Bridge onChange={onChange} />
    </Providers>
  );
}

/** The full connect / sign panel with its own provider (shares the singleton wagmi config). */
export function WalletPanel() {
  return (
    <Providers>
      <WalletPanelInner />
    </Providers>
  );
}
