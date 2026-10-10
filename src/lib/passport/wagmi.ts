import { fallback, http } from "viem";
import { createConfig, injected } from "wagmi";
import { monad } from "@/lib/passport/chain";

const rpcUrls = monad.rpcUrls.default.http;

export const wagmiConfig = createConfig({
  chains: [monad],
  connectors: [injected()],
  transports: {
    [monad.id]: fallback(rpcUrls.map((url) => http(url, { timeout: 8_000, retryCount: 0 }))),
  },
  ssr: true,
  multiInjectedProviderDiscovery: true,
});
