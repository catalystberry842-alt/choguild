import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { ChogCard, TIER_TITLE } from "@/components/chog/chog-card";
import { LevelUpWatcher } from "@/components/chog/level-up";
import { useQuestPing } from "@/components/chog/quest-panel";
import { RankCardActions } from "@/components/chog/rank-card";
import { ChogTip } from "@/components/chog/chog-tip";
import { DuelChallenge, DuelHistory } from "@/components/chog/duel";
import { getDuelBoard } from "@/lib/duels/functions";
import { getChogPaid } from "@/lib/rewards/functions";
import { NotFoundState } from "@/components/layout/not-found";
import { usePassport } from "@/components/passport/passport-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { emptyBoardSearch } from "@/lib/board/search";
import { CHOG_CONTRACT, isChogTokenId } from "@/lib/chog/chog";
import { explorerAddressUrl } from "@/lib/passport/chain";
import { formatStamp, shortAddress } from "@/lib/passport/format";
import { setActingChog } from "@/lib/passport/functions";
import { getChogRecord } from "@/lib/ranking/functions";
import { formatXp } from "@/lib/ranking/xp";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/chog/$chogId")({
  loader: async ({ params }) => {
    const id = Number(params.chogId);
    if (!isChogTokenId(id)) throw notFound();
    const [record, duels, paid] = await Promise.all([getChogRecord({ data: id }), getDuelBoard({ data: id }), getChogPaid({ data: id }).catch(() => ({ total: "0", count: 0 }))]);
    return { ...record, duels, paid };
  },
  staticData: { title: "Chog record", crumb: "Chog" },
  pendingComponent: () => <LoadingState label="Loading Chog" layout="detail" />,
  head: ({ loaderData, params }) =>
    seo({
      title: loaderData?.profile ? `${loaderData.profile.displayName} · Chog #${params.chogId} · Choguild` : `Chog #${params.chogId} · Choguild`,
      description: loaderData?.standing
        ? `Chog #${params.chogId}: ${loaderData.tier}, rank ${loaderData.standing.rank} with ${loaderData.standing.xp} XP. Its record travels with the NFT.`
        : `Chog Genesis #${params.chogId} on Choguild. The NFT is the member; its record travels with it.`,
      path: `/chog/${params.chogId}`,
      noindex: !loaderData?.profile,
    }),
  component: ChogPage,
  notFoundComponent: () => <NotFoundState title="Not a Chog" description="Chog Genesis token ids run from 1 to 1969." />,
});

function ChogPage() {
  const record = Route.useLoaderData();
  const router = useRouter();
  const { sessionAddress, chogId: actingId, refresh } = usePassport();
  const choose = useServerFn(setActingChog);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chogId, profile, standing, owner } = record;
  const mineNow = Boolean(sessionAddress && owner && owner === sessionAddress.toLowerCase());
  const acting = actingId === chogId;
  useQuestPing("rival", String(chogId), Boolean(actingId) && actingId !== chogId && !mineNow);
  const xp = standing?.xp ?? 0;
  const name = profile?.displayName ?? `Chog #${chogId}`;
  const explorer = owner ? explorerAddressUrl(owner) : null;

  async function actAsThis() {
    setBusy(true);
    setError(null);
    try {
      const r = await choose({ data: { chogId } });
      if (!r.ok) setError(r.error);
      await refresh();
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {acting && standing ? <LevelUpWatcher chogId={chogId} xp={xp} name={name} /> : null}
      <section className="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)] md:items-start">
        <ChogCard chogId={chogId} name={profile?.displayName} xp={xp} rank={standing?.rank} streak={standing?.streak} className="mx-auto md:mx-0" />
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <p className="tier-title">{TIER_TITLE[record.tier] ?? record.tier}</p>
            <h1 className="t-title mt-1 text-ink">{name}</h1>
            <p className="t-meta mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Chog Genesis #{chogId}</span>
              {profile ? (<><span aria-hidden="true">·</span><span>@{profile.username}</span></>) : null}
              <span aria-hidden="true">·</span>
              {record.ownerKnown ? (
                owner ? (
                  <span>
                    Held by{" "}
                    {explorer ? <a className="t-link" href={explorer} target="_blank" rel="noreferrer">{shortAddress(owner)}</a> : shortAddress(owner)}
                    {mineNow ? " (you)" : ""}
                  </span>
                ) : (
                  <span>Not minted</span>
                )
              ) : (
                <span>Owner unavailable (Monad RPC)</span>
              )}
            </p>
          </div>
          {profile?.biography ? <p className="t-body max-w-2xl text-pretty">{profile.biography}</p> : null}
          {standing ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ["Rank", `#${standing.rank}`, `of ${standing.of}`],
                [`Season ${record.season.number}`, standing.seasonRank ? `#${standing.seasonRank}` : "—", `${formatXp(standing.seasonXp)} XP this week`],
                ["XP", formatXp(standing.xp), `${formatXp(standing.guildXp)} work · ${formatXp(standing.questXp)} quests`],
                ["Streak", `${standing.streak}d`, "daily check-ins"],
              ] as const).map(([label, value, hint]) => (
                <div key={label} className="surface p-3">
                  <dt className="t-kicker">{label}</dt>
                  <dd className="mt-1 text-lead font-semibold tabular-nums text-ink">{value}</dd>
                  <dd className="text-label text-muted">{hint}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {mineNow && !acting ? <Button size="compact" onClick={() => void actAsThis()} disabled={busy}>{busy ? "Checking ownerOf…" : `Act as #${chogId}`}</Button> : null}
            {acting ? <Button asChild size="compact"><Link to="/passport">Quests and passport</Link></Button> : null}
            <Button asChild size="compact" variant="secondary"><Link to="/ranking">Leaderboard</Link></Button>
            <Button asChild size="compact" variant="ghost">
              <a href={`https://monadscan.com/nft/${CHOG_CONTRACT}/${chogId}`} target="_blank" rel="noreferrer">
                MonadScan <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
          {error ? <p role="alert" className="text-small text-danger">{error}</p> : null}
        </div>
      </section>

      <section aria-labelledby="duel-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="duel-title" className="t-h3">Duels</h2>
          <p className="t-meta">Capped duel XP counts toward the season.</p>
        </div>
        {owner && !mineNow ? <DuelChallenge defenderId={chogId} actingId={actingId ?? null} left={record.duels.left} /> : null}
        <DuelHistory chogId={chogId} history={record.duels.history} />
      </section>

      {standing ? (
        <section aria-labelledby="share-title" className="flex flex-col gap-3">
          <h2 id="share-title" className="t-h3">Share the rank card</h2>
          <RankCardActions data={{ chogId, name, xp, rank: standing.rank, of: standing.of, seasonRank: standing.seasonRank, season: record.season.number, streak: standing.streak }} />
        </section>
      ) : null}

      {owner && !mineNow ? (
        <section aria-labelledby="tip-title" className="flex flex-col gap-3">
          <h2 id="tip-title" className="t-h3">Tip in $CHOG</h2>
          <ChogTip chogId={chogId} holder={owner} />
        </section>
      ) : null}

      <section aria-labelledby="record-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="record-title" className="t-h3">Record</h2>
          <p className="t-meta">Keyed to the token, not the wallet. A new owner inherits it.</p>
        </div>
        {standing ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ["Accepted work", standing.counts.acceptedSubmissions],
              ["Accepted applications", standing.counts.acceptedApplications],
              ["Listings credited", standing.counts.publishedOpportunities],
              ["$CHOG rewards paid", record.paid.total],
            ] as const).map(([label, n]) => (
              <li key={label} className="surface p-3">
                <p className="text-lead font-semibold tabular-nums text-ink">{n}</p>
                <p className="text-label text-muted">{label}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {record.work && record.work.items.length > 0 ? (
          <ul className="grid gap-2">
            {record.work.items.map((item) => (
              <li key={item.id} className="surface p-4">
                <Link to="/submissions/$submissionId" params={{ submissionId: item.id }} className="text-base font-medium text-ink hover:underline">{item.title}</Link>
                <p className="t-meta mt-1">{item.projectName} · {item.opportunityTitle} · Accepted {formatStamp(item.acceptedAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            title={profile ? "No accepted work yet" : "This Chog hasn't joined the guild yet"}
            body={profile ? "Work a listing's poster accepts lands here, on the token, for good." : mineNow ? "You hold it. Act as it and save its passport to start a record." : "When its holder saves a passport, its record starts here."}
            action={
              <Button asChild size="compact" variant="secondary">
                {mineNow ? <Link to="/passport">Open passport</Link> : <Link to="/discover" search={emptyBoardSearch()}>Browse listings</Link>}
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
