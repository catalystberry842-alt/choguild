import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { encodeFunctionData, parseAbi } from "viem";
import { Button } from "@/components/ui/button";
import { CHOG_TOKEN, CHOG_TOKEN_URL } from "@/lib/chog/chog";
import { shortAddress } from "@/lib/passport/format";
import { getRewardStatus, recordRewardPayment } from "@/lib/rewards/functions";
import { rewardWei } from "@/lib/rewards/rewards";

type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
type Status = Awaited<ReturnType<typeof getRewardStatus>>;
const erc20 = parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]);

/**
 * $CHOG reward on an accepted application or submission. The publisher's wallet sends a plain transfer to
 * the accepted Chog's current holder; the server verifies the Transfer log before it shows Paid.
 */
export function RewardPanel({ kind, id }: { kind: "application" | "submission"; id: string }) {
  const get = useServerFn(getRewardStatus);
  const record = useServerFn(recordRewardPayment);
  const [status, setStatus] = useState<Status>(null);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "error"; text?: string; hash?: string }>({ kind: "idle" });

  useEffect(() => {
    let live = true;
    get({ data: { kind, id } }).then((s) => live && setStatus(s)).catch(() => undefined);
    return () => { live = false; };
  }, [get, kind, id]);

  if (!status) return null;
  const amount = Number(status.reward).toLocaleString("en-US", { maximumFractionDigits: 4 });

  async function verify(hash: string) {
    setState({ kind: "busy", text: "Verifying the transfer onchain…", hash });
    const r = await record({ data: { kind, id, txHash: hash } });
    if (!r.ok) return setState({ kind: "error", text: r.error, hash });
    setStatus((s) => (s ? { ...s, payment: r.payment } : s));
    setState({ kind: "idle" });
  }

  async function pay() {
    const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
    if (!eth || !status?.holder) return setState({ kind: "error", text: "Open this page in a browser wallet (MetaMask, Rabby) to pay." });
    setState({ kind: "busy", text: "Confirm in your wallet…" });
    try {
      const [from] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x8f" }] });
      const data = encodeFunctionData({ abi: erc20, functionName: "transfer", args: [status.holder as `0x${string}`, rewardWei(status.reward)] });
      const hash = (await eth.request({ method: "eth_sendTransaction", params: [{ from, to: CHOG_TOKEN, data }] })) as string;
      await verify(hash);
    } catch (error) {
      setState({ kind: "error", text: error instanceof Error ? error.message.split("\n")[0] : "The wallet rejected the payment." });
    }
  }

  return (
    <section aria-label="$CHOG reward" className="surface flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-semibold text-ink">{amount} <a className="t-link" href={CHOG_TOKEN_URL} target="_blank" rel="noreferrer">$CHOG</a> reward</p>
        {status.payment ? <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-label font-medium text-success">Paid</span> : null}
      </div>
      {status.payment ? (
        <p className="t-meta">
          {status.payment.amount} $CHOG sent to {shortAddress(status.payment.payee)}, holder of Chog #{status.chogId}, verified onchain.{" "}
          <a className="t-link" href={`https://monadscan.com/tx/${status.payment.txHash}`} target="_blank" rel="noreferrer">View transaction</a>
        </p>
      ) : !status.accepted ? (
        <p className="t-meta">Paid by the publisher to Chog #{status.chogId}'s holder if this is accepted.</p>
      ) : status.isPublisher ? (
        <>
          <p className="t-meta">
            Accepted. Pay Chog #{status.chogId}'s current holder {status.holder ? shortAddress(status.holder) : "(couldn't read ownerOf)"} from your wallet. Nothing is escrowed; it's marked Paid once the Transfer is verified on Monad.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="compact" onClick={() => void pay()} disabled={state.kind === "busy" || !status.holder}>{state.kind === "busy" ? state.text : `Pay ${amount} $CHOG`}</Button>
            {state.kind === "error" && state.hash ? <Button size="compact" variant="secondary" onClick={() => void verify(state.hash!)}>Verify again</Button> : null}
          </div>
        </>
      ) : (
        <p className="t-meta">Accepted. Awaiting the publisher's payment to Chog #{status.chogId}'s holder.</p>
      )}
      {state.kind === "error" ? <p role="alert" className="text-small text-danger">{state.text}</p> : null}
    </section>
  );
}
