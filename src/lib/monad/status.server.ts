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

export async function probeMonadRpc(envValue?: string): Promise<MonadProbe> {
  const url = monadRpcUrls(envValue)[0] ?? monad.rpcUrls.default.http[0];
  const rpcHost = hostOf(url);
  try {
    const client = createPublicClient({
      chain: monad,
      transport: http(url, { timeout: 8_000, retryCount: 0 }),
    });
    const chainId = await client.getChainId();
    if (chainId !== MONAD_CHAIN_ID) {
      return { ok: false, rpcHost, error: `The RPC answered chain ${chainId}, not Monad mainnet (${MONAD_CHAIN_ID}).` };
    }
    const blockNumber = await client.getBlockNumber();
    return { ok: true, chainId, blockNumber: blockNumber.toString(), rpcHost };
  } catch {
    return {
      ok: false,
      rpcHost,
      error: "The Monad RPC did not respond in time. This does not mean your wallet is connected.",
    };
  }
}
