import { fallback, http } from "viem";
import { createConfig, injected } from "wagmi";
import { monad } from "@/lib/passport/chain";

const rpcUrls = monad.rpcUrls.default.http;

/**
 * Connectors: browser wallets only. Every EIP-6963 wallet (MetaMask, Rabby, Phantom…) is
 * discovered automatically, plus a generic injected fallback. No Coinbase SDK, no WalletConnect.
 */
export const wagmiConfig = createConfig({
  chains: [monad],
  connectors: [injected()],
  transports: {
    [monad.id]: fallback(rpcUrls.map((url) => http(url, { timeout: 6_000, retryCount: 0 }))),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});

/** Connectors that open their own UI and must not be probed for an injected provider (none today). */
export const REMOTE_CONNECTOR_TYPES = new Set<string>();

/** Connectors hidden from the picker: Coinbase is never offered, even if its extension announces itself. */
export function isAllowedConnector(c: { id: string; name: string; type: string }): boolean {
  const s = `${c.id} ${c.name} ${c.type}`.toLowerCase();
  return !s.includes("coinbase") && !s.includes("walletconnect");
}
