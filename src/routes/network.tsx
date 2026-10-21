import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useWalletState } from "@/components/passport/wallet-state";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { MONAD_CHAIN_ID, MONAD_EXPLORERS, monadChainLabel } from "@/lib/passport/chain";
import { getMonadStatus } from "@/lib/monad/functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/network")({
  loader: () => getMonadStatus(),
  staticData: { title: "Network", crumb: "Network" },
  head: () => seo({ title: "Network · Choguild", description: "Live Monad mainnet status and Choguild network activity.", path: "/network" }),
  component: NetworkPage,
});

function NetworkPage() {
  const probe = Route.useLoaderData();
  const { isConnected, chainId } = useWalletState();
  const wallet = monadChainLabel(isConnected ? chainId : undefined);

  return (
    <div>
      <PageHeader eyebrow="Network" title="Network" description="Choguild runs on Monad mainnet. Testnet isn't used." />

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        <Fact label="Chain">
          <span className="text-lead font-semibold tracking-tight">Monad mainnet</span>
          <span className="t-meta mt-1 block tabular-nums">Chain ID {MONAD_CHAIN_ID}</span>
        </Fact>
        <Fact label="Public RPC">
          <span className="flex items-center gap-2">
            <span className={probe.ok ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-warning"} aria-hidden="true" />
            <span className="text-lead font-semibold tracking-tight">{probe.ok ? "Online" : "Not responding"}</span>
          </span>
          <span className="t-meta mt-1 block tabular-nums">{probe.ok ? `Block ${Number(probe.blockNumber).toLocaleString("en-US")}` : probe.rpcHost}</span>
        </Fact>
        <Fact label="Your wallet">
          <Badge tone={wallet.onMonad ? "olive" : "neutral"}>{isConnected ? wallet.label : "Not connected"}</Badge>
        </Fact>
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {MONAD_EXPLORERS.map((explorer) => (
          <a key={explorer.url} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-small text-body transition-colors hover:border-line-strong hover:text-ink" href={explorer.url} target="_blank" rel="noreferrer">
            {explorer.name} <span aria-hidden="true">↗</span>
          </a>
        ))}
        <a className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-small text-body transition-colors hover:border-line-strong hover:text-ink" href="https://docs.monad.xyz/developer-essentials/network-information" target="_blank" rel="noreferrer">
          Monad docs <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="surface p-6">
      <dt className="t-meta">{label}</dt>
      <dd className="t-body mt-3 text-ink">{children}</dd>
    </div>
  );
}
