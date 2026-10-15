import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { MONAD_CHAIN_ID, MONAD_EXPLORERS, monadChainLabel } from "@/lib/passport/chain";
import { getMonadStatus } from "@/lib/monad/functions";

export const Route = createFileRoute("/network")({
  loader: () => getMonadStatus(),
  staticData: { title: "Network", crumb: "Network" },
  head: () => ({ meta: [{ title: "Network · Choguild" }] }),
  component: NetworkPage,
});

function NetworkPage() {
  const probe = Route.useLoaderData();
  const { isConnected, chainId } = useAccount();
  const wallet = monadChainLabel(isConnected ? chainId : undefined);

  return (
    <div>
      <PageHeader eyebrow="Network" title="Network" description="Choguild runs on Monad mainnet. Testnet isn't used." />

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        <Fact label="Chain">
          <span className="font-mono">Monad · {MONAD_CHAIN_ID}</span>
        </Fact>
        <Fact label="Public RPC">
          <span className="flex items-center gap-2">
            <span className={probe.ok ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} aria-hidden="true" />
            {probe.ok ? "Online" : "Not responding"}
          </span>
          <span className="t-meta mt-1 block font-mono">{probe.ok ? `Block ${probe.blockNumber}` : probe.rpcHost}</span>
        </Fact>
        <Fact label="Your wallet">
          <Badge tone={wallet.onMonad ? "olive" : "neutral"}>{isConnected ? wallet.label : "Not connected"}</Badge>
        </Fact>
      </dl>

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
        {MONAD_EXPLORERS.map((explorer) => (
          <a key={explorer.url} className="t-link text-sm" href={explorer.url} target="_blank" rel="noreferrer">
            {explorer.name}
          </a>
        ))}
        <a className="t-link text-sm" href="https://docs.monad.xyz/developer-essentials/network-information" target="_blank" rel="noreferrer">
          Monad docs
        </a>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="surface p-6">
      <dt className="t-meta">{label}</dt>
      <dd className="t-body mt-2 text-ink">{children}</dd>
    </div>
  );
}
