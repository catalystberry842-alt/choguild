import { defineChain } from "viem";

/**
 * Active network: Monad mainnet.
 * Sources checked 2026-10-10:
 * - https://docs.monad.xyz/developer-essentials/network-information
 * - https://docs.monad.xyz/ai/current-facts
 * - https://docs.monad.xyz/networks.json
 *
 * Mainnet chain id is 143, currency MON, public RPC https://rpc.monad.xyz,
 * explorers https://monadvision.com and https://monadscan.com.
 *
 * Testnet is a different network (chain id 10143, https://testnet-rpc.monad.xyz,
 * https://testnet.monadvision.com). It is not configured. Passport sessions in
 * this app already use chain 143, and this is not a faucet sandbox.
 */
/**
 * Ordered fallback list. rpc.monad.xyz timed out from Vercel and the box on
 * 2026-10-15 while the numbered endpoints, monadinfra, dRPC and Ankr all
 * answered chain 0x8f, so the flaky one goes last.
 */
export const MONAD_OFFICIAL_RPCS = [
  "https://rpc1.monad.xyz",
  "https://rpc2.monad.xyz",
  "https://rpc3.monad.xyz",
  "https://rpc-mainnet.monadinfra.com",
  "https://monad-mainnet.drpc.org",
  "https://rpc.ankr.com/monad_mainnet",
  "https://rpc.monad.xyz",
] as const;

export const MONAD_EXPLORERS = [
  { name: "MonadVision", url: "https://monadvision.com" },
  { name: "Monadscan", url: "https://monadscan.com" },
] as const;

export function monadRpcUrls(envValue?: string): string[] {
  const custom = (envValue ?? "").trim();
  if (/^https:\/\/[^\s]+$/.test(custom) && custom.length <= 200) {
    return [custom, ...MONAD_OFFICIAL_RPCS.filter((url) => url !== custom)];
  }
  return [...MONAD_OFFICIAL_RPCS];
}

const configuredRpcs = monadRpcUrls(
  typeof import.meta !== "undefined" ? (import.meta.env?.VITE_MONAD_RPC_URL as string | undefined) : undefined,
);

export const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: configuredRpcs },
  },
  blockExplorers: {
    default: { name: MONAD_EXPLORERS[0].name, url: MONAD_EXPLORERS[0].url },
  },
});

export const MONAD_CHAIN_ID = monad.id;

export function monadChainLabel(chainId: number | undefined): { onMonad: boolean; label: string } {
  if (chainId == null) return { onMonad: false, label: "No network reported" };
  if (chainId === MONAD_CHAIN_ID) return { onMonad: true, label: "Monad mainnet" };
  return { onMonad: false, label: `Chain ${chainId}` };
}

export function explorerAddressUrl(address: string, explorer = MONAD_EXPLORERS[0].url): string | null {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
  return `${explorer}/address/${address}`;
}
