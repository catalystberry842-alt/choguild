import { fallback, http } from "viem";
import { createConfig, createConnector, injected, type CreateConnectorFn } from "wagmi";
import { monad } from "@/lib/passport/chain";

const rpcUrls = monad.rpcUrls.default.http;

/** WalletConnect needs a Reown/WalletConnect Cloud project id; without one it simply isn't offered. */
const walletConnectProjectId = (import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID as string | undefined)?.trim();

const APP = { name: "Choguild", url: "https://choguild.vercel.app", icon: "https://choguild.vercel.app/apple-touch-icon.png" };

/**
 * Connectors: every EIP-6963 browser wallet (MetaMask, Rabby, Phantom…) is discovered automatically,
 * plus generic injected, Coinbase Wallet (smart wallet or app, works without an extension) and
 * WalletConnect when configured. The Coinbase and WalletConnect SDKs load only when the user picks them.
 */
type Meta = { id: string; name: string; type: string; icon?: string };

/**
 * A connector shell whose real implementation (and SDK) is imported on first use.
 * Keeps the Coinbase / WalletConnect code out of the server bundle and out of the
 * initial client download.
 */
function lazyConnector(meta: Meta, load: () => Promise<CreateConnectorFn>): CreateConnectorFn {
  return createConnector((config) => {
    let inner: ReturnType<CreateConnectorFn> | undefined;
    const real = async () => {
      if (!inner) {
        const fn = await load();
        inner = fn(config);
        await inner.setup?.();
      }
      return inner;
    };
    return {
      ...meta,
      async setup() {},
      async connect(params) {
        return (await real()).connect(params as never) as never;
      },
      async disconnect() {
        if (inner) await inner.disconnect();
      },
      async getAccounts() {
        return (await real()).getAccounts();
      },
      async getChainId() {
        return (await real()).getChainId();
      },
      async getProvider(params) {
        return (await real()).getProvider(params);
      },
      async isAuthorized() {
        // Only ask the SDK if it was already loaded; otherwise a reload stays SDK-free.
        return inner ? inner.isAuthorized() : false;
      },
      async switchChain(params) {
        const target = await real();
        if (!target.switchChain) throw new Error("This wallet cannot switch networks.");
        return target.switchChain(params);
      },
      onAccountsChanged(accounts) {
        inner?.onAccountsChanged(accounts);
      },
      onChainChanged(chainId) {
        inner?.onChainChanged(chainId);
      },
      onDisconnect(error) {
        inner?.onDisconnect(error);
      },
    };
  });
}

const serverOnly = (): Promise<never> => Promise.reject(new Error("Wallet connectors run in the browser only."));

const coinbase = lazyConnector({ id: "coinbaseWalletSDK", name: "Coinbase Wallet", type: "coinbaseWallet" }, () =>
  import.meta.env.SSR
    ? serverOnly()
    : import("wagmi/connectors").then((m) => m.coinbaseWallet({ appName: APP.name, appLogoUrl: APP.icon })),
);

const walletConnectLazy = (projectId: string) =>
  lazyConnector({ id: "walletConnect", name: "WalletConnect", type: "walletConnect" }, () =>
    import.meta.env.SSR
      ? serverOnly()
      : import("wagmi/connectors").then((m) =>
          m.walletConnect({
            projectId,
            showQrModal: true,
            metadata: { name: APP.name, description: "Get work and earn your rank.", url: APP.url, icons: [APP.icon] },
          }),
        ),
  );

export const wagmiConfig = createConfig({
  chains: [monad],
  connectors: [
    injected(),
    coinbase,
    ...(walletConnectProjectId ? [walletConnectLazy(walletConnectProjectId)] : []),
  ],
  transports: {
    [monad.id]: fallback(rpcUrls.map((url) => http(url, { timeout: 6_000, retryCount: 0 }))),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});

/** Connectors that open their own UI (QR/popup) and must not be probed for an injected provider. */
export const REMOTE_CONNECTOR_TYPES = new Set(["coinbaseWallet", "walletConnect"]);
