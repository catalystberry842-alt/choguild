import { createPublicClient, http } from "viem";
import { MONAD_CHAIN_ID, monad, monadRpcUrls } from "@/lib/passport/chain";

export type MonadProbe =
  | { ok: true; chainId: number; blockNumber: string; rpcHost: string }
  | { ok: false; error: string; rpcHost: string };

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

/** Probe each RPC in order (short timeout) and report the first one that answers as Monad mainnet. */
export async function probeMonadRpc(envValue?: string, urlsOverride?: string[]): Promise<MonadProbe> {
  const urls = urlsOverride ?? monadRpcUrls(envValue);
  let lastError = "The Monad RPC did not respond in time. This does not mean your wallet is connected.";
  for (const url of urls.slice(0, 5)) {
    const rpcHost = hostOf(url);
    try {
      const client = createPublicClient({ chain: monad, transport: http(url, { timeout: 3_000, retryCount: 0 }) });
      const chainId = await client.getChainId();
      if (chainId !== MONAD_CHAIN_ID) {
        lastError = `The RPC answered chain ${chainId}, not Monad mainnet (${MONAD_CHAIN_ID}).`;
        continue;
      }
      const blockNumber = await client.getBlockNumber();
      return { ok: true, chainId, blockNumber: blockNumber.toString(), rpcHost };
    } catch {
      // try the next endpoint
    }
  }
  return { ok: false, rpcHost: hostOf(urls[0] ?? monad.rpcUrls.default.http[0]), error: lastError };
}
