import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { DuelArena, duelShareUrl } from "@/components/chog/duel";
import { NotFoundState } from "@/components/layout/not-found";
import { Button } from "@/components/ui/button";
import { formatStamp } from "@/lib/passport/format";
import { getDuelResult } from "@/lib/duels/functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/duel/$duelId")({
  loader: async ({ params }) => {
    if (!/^[0-9a-f]{16}$/.test(params.duelId)) throw notFound();
    const duel = await getDuelResult({ data: params.duelId });
    if (!duel) throw notFound();
    return duel;
  },
  staticData: { title: "Duel", crumb: "Duel" },
  head: ({ loaderData: d, params }) =>
    seo({
      title: d ? `Chog #${d.challengerId} vs Chog #${d.defenderId} · Choguild duel` : "Choguild duel",
      description: d ? `${d.challengerScore}-${d.defenderScore}. A three-round Chog duel on Choguild.` : "A Chog duel on Choguild.",
      path: `/duel/${params.duelId}`,
      noindex: true,
    }),
  component: DuelPage,
  notFoundComponent: () => <NotFoundState title="Duel not found" description="That duel id doesn't exist." />,
});

function DuelPage() {
  const duel = Route.useLoaderData();
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div>
        <p className="t-kicker">Chog duel</p>
        <h1 className="t-title mt-1 text-ink">#{duel.challengerId} vs #{duel.defenderId}</h1>
        <p className="t-meta mt-1">{formatStamp(duel.createdAt)} · resolved on the server; the defender auto-plays from its signature move and tier.</p>
      </div>
      <div className="surface p-4"><DuelArena duel={duel} /></div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="compact"><a href={duelShareUrl(duel)} target="_blank" rel="noreferrer"><Share2 className="size-3.5" aria-hidden="true" /> Share on X</a></Button>
        <Button asChild size="compact" variant="secondary"><Link to="/chog/$chogId" params={{ chogId: String(duel.challengerId) }}>Chog #{duel.challengerId}</Link></Button>
        <Button asChild size="compact" variant="secondary"><Link to="/chog/$chogId" params={{ chogId: String(duel.defenderId) }}>Chog #{duel.defenderId}</Link></Button>
      </div>
    </div>
  );
}
