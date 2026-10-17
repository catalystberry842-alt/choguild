import { fallback, http } from "viem";
import { createConfig, injected } from "wagmi";
import { monad } from "@/lib/passport/chain";

const rpcUrls = monad.rpcUrls.default.http;

/**
 * Connectors: browser wallets only. Every EIP-6963 wallet (MetaMask, Rabby…) is
 * discovered automatically, plus a generic injected fallback. No Coinbase SDK,
 * no WalletConnect, no Phantom.
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

/**
 * Connectors hidden from the picker: Coinbase, WalletConnect, and Phantom
 * (matched by name, id, or EIP-6963 rdns such as app.phantom).
 */
export function isAllowedConnector(c: {
  id: string;
  name: string;
  type: string;
  rdns?: string | readonly string[] | null;
}): boolean {
  const rdns = Array.isArray(c.rdns) ? c.rdns.join(" ") : (c.rdns ?? "");
  const s = `${c.id} ${c.name} ${c.type} ${rdns}`.toLowerCase();
  return !s.includes("coinbase") && !s.includes("walletconnect") && !s.includes("phantom");
}
