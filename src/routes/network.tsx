import { createFileRoute, Link } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { WalletPanel } from "@/components/passport/wallet-panel";
import { Badge } from "@/components/ui/badge";
import { MONAD_CHAIN_ID, MONAD_EXPLORERS, monadChainLabel } from "@/lib/passport/chain";
import { getMonadStatus } from "@/lib/monad/functions";

export const Route = createFileRoute("/network")({
  loader: () => getMonadStatus(),
  staticData: { title: "Monad", crumb: "Monad" },
  head: () => ({ meta: [{ title: "Monad · Choguild" }] }),
  component: NetworkPage,
});

function NetworkPage() {
  const probe = Route.useLoaderData();
  const { isConnected, chainId } = useAccount();
  const wallet = monadChainLabel(isConnected ? chainId : undefined);

  return (
    <div className="grid gap-12">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Monad mainnet</p>
        <h1 className="mt-3 text-[2.5rem] font-bold tracking-tight text-ink">Network</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-body">
          Choguild uses a wallet address as an identifier. A signature proves you control that address. Accepted work is a review record kept by Choguild. It is not a Monad transaction, a balance, or an on-chain credential.
        </p>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-line bg-elevated p-6">
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Configured chain</dt>
            <dd className="mt-2 font-mono text-sm text-ink">Monad · {MONAD_CHAIN_ID}</dd>
            <dd className="mt-1 text-sm text-body">Currency is MON, and no balance is read.</dd>
          </div>
          <div className="rounded-3xl border border-line bg-elevated p-6">
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Public RPC</dt>
            <dd className="mt-2 text-sm text-ink">{probe.ok ? "Responded" : "Unavailable"}</dd>
            <dd className="mt-1 font-mono text-xs text-muted">{probe.rpcHost}</dd>
            {probe.ok ? (
              <dd className="mt-2 text-sm text-body">Chain {probe.chainId} confirmed. Latest block {probe.blockNumber}.</dd>
            ) : (
              <dd className="mt-2 text-sm text-warning">{probe.error}</dd>
            )}
          </div>
          <div className="rounded-3xl border border-line bg-elevated p-6">
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">This wallet</dt>
            <dd className="mt-2">
              <Badge tone={wallet.onMonad ? "olive" : "warning"}>{isConnected ? wallet.label : "Not connected"}</Badge>
            </dd>
            <dd className="mt-2 text-sm text-body">The badge uses the chain the wallet reported rather than assuming one.</dd>
          </div>
          <div className="rounded-3xl border border-line bg-elevated p-6">
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">On-chain credentials</dt>
            <dd className="mt-2 text-sm text-body">This is planned but not built yet, so no contract is deployed and no attestation is issued.</dd>
          </div>
        </dl>
        <div className="mt-10 flex flex-wrap gap-4">
          {MONAD_EXPLORERS.map((explorer) => (
            <a key={explorer.url} className="text-sm font-semibold text-sand" href={explorer.url} target="_blank" rel="noreferrer">
              {explorer.name}
            </a>
          ))}
          <a className="text-sm font-semibold text-sand" href="https://docs.monad.xyz/developer-essentials/network-information" target="_blank" rel="noreferrer">
            Network documentation
          </a>
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-7 text-muted">
          Testnet (chain 10143) is a separate network and is not used here.{" "}
          <Link to="/passport" className="text-sand">Passport</Link> ownership stays on the address that signed in.
        </p>
      </div>
      <aside className="rounded-3xl border border-line bg-elevated p-6">
        <h2 className="text-sm font-semibold text-ink">Wallet</h2>
        <div className="mt-3">
          <WalletPanel />
        </div>
      </aside>
    </div>
  );
}
