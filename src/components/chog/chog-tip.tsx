import { useState } from "react";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { CHOG_TOKEN, CHOG_TOKEN_DECIMALS, CHOG_TOKEN_URL } from "@/lib/chog/chog";

type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
const erc20 = parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]);

/**
 * Escrow-less $CHOG tip: the tipper's own wallet sends an ERC-20 transfer straight to the Chog's
 * current holder (resolved live with ownerOf). Choguild never touches the funds.
 */
export function ChogTip({ chogId, holder }: { chogId: number; holder: string }) {
  const [amount, setAmount] = useState("100");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; text?: string }>({ kind: "idle" });

  async function tip() {
    const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
    if (!eth) return setState({ kind: "error", text: "Open this page in a browser wallet (MetaMask, Rabby) to tip." });
    let value: bigint;
    try {
      value = parseUnits(amount, CHOG_TOKEN_DECIMALS);
      if (value <= 0n) throw new Error();
    } catch {
      return setState({ kind: "error", text: "Enter an amount of $CHOG." });
    }
    setState({ kind: "busy" });
    try {
      const [from] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x8f" }] });
      const data = encodeFunctionData({ abi: erc20, functionName: "transfer", args: [holder as `0x${string}`, value] });
      const hash = (await eth.request({ method: "eth_sendTransaction", params: [{ from, to: CHOG_TOKEN, data }] })) as string;
      setState({ kind: "done", text: hash });
    } catch (error) {
      setState({ kind: "error", text: error instanceof Error ? error.message.split("\n")[0] : "The wallet rejected the tip." });
    }
  }

  return (
    <div className="surface flex flex-col gap-3 p-4">
      <p className="t-body">
        Send <a className="t-link" href={CHOG_TOKEN_URL} target="_blank" rel="noreferrer">$CHOG</a> straight to whoever holds Chog #{chogId} right now. Your wallet signs a plain token transfer; nothing is escrowed and Choguild never holds it.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="tip-amount" className="sr-only">Amount of $CHOG</label>
        <input id="tip-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} className="h-9 w-28 rounded-lg border border-line bg-transparent px-3 text-small tabular-nums" />
        <span className="text-small text-muted">$CHOG</span>
        <Button size="compact" onClick={() => void tip()} disabled={state.kind === "busy"}>{state.kind === "busy" ? "Confirm in wallet…" : "Tip holder"}</Button>
      </div>
      {state.kind === "done" ? (
        <p className="text-small text-ink">Sent. <a className="t-link" href={`https://monadscan.com/tx/${state.text}`} target="_blank" rel="noreferrer">View transaction</a></p>
      ) : null}
      {state.kind === "error" ? <p role="alert" className="text-small text-danger">{state.text}</p> : null}
    </div>
  );
}
