import { fallback, http } from "viem";
import { createConfig, injected } from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { monad } from "@/lib/passport/chain";

const rpcUrls = monad.rpcUrls.default.http;

/** WalletConnect needs a Reown/WalletConnect Cloud project id; without one it simply isn't offered. */
const walletConnectProjectId = (import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID as string | undefined)?.trim();

const APP = { name: "Choguild", url: "https://choguild.vercel.app", icon: "https://choguild.vercel.app/apple-touch-icon.png" };

/**
 * Connectors: every EIP-6963 browser wallet (MetaMask, Rabby, Phantom…) is discovered automatically,
 * plus generic injected, Coinbase Wallet (smart wallet or app, works without an extension) and
 * WalletConnect when configured. The Coinbase and WalletConnect SDKs are dynamic imports inside
 * their connectors, so they only download when the user picks them.
 */
export const wagmiConfig = createConfig({
  chains: [monad],
  connectors: [
    injected(),
    coinbaseWallet({ appName: APP.name, appLogoUrl: APP.icon }),
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
            showQrModal: true,
            metadata: { name: APP.name, description: "Get work and earn your rank.", url: APP.url, icons: [APP.icon] },
          }),
        ]
      : []),
  ],
  transports: {
    [monad.id]: fallback(rpcUrls.map((url) => http(url, { timeout: 6_000, retryCount: 0 }))),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});

/** Connectors that open their own UI (QR/popup) and must not be probed for an injected provider. */
export const REMOTE_CONNECTOR_TYPES = new Set(["coinbaseWallet", "walletConnect"]);
