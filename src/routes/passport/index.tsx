import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfileForm } from "@/components/passport/profile-form";
import { usePassport } from "@/components/passport/passport-provider";
import { LazyWalletPanel } from "@/components/passport/lazy-wallet-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { emptyBoardSearch } from "@/lib/board/search";
import { seo } from "@/lib/seo";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ActingChogPicker } from "@/components/chog/acting-chog";
import { ChogCard } from "@/components/chog/chog-card";
import { LevelUpWatcher } from "@/components/chog/level-up";
import { QuestPanel } from "@/components/chog/quest-panel";
import { getChogRecord, type ChogRecord } from "@/lib/ranking/functions";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/passport/")({
  staticData: { title: "Contributor Passport", crumb: "Passport" },
  head: () => seo({ title: "Passport · Choguild", description: "Act as your Chog Genesis NFT: pick a Chog you hold, take daily quests and build a record that lives on the token.", path: "/passport" }),
  component: PassportPage,
});

function PassportPage() {
  const { status, error, sessionAddress, profile, chogId } = usePassport();
  const verified = Boolean(sessionAddress);
  const loadRecord = useServerFn(getChogRecord);
  const [record, setRecord] = useState<ChogRecord | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (!chogId) return;
    let live = true;
    loadRecord({ data: chogId })
      .then((r) => live && setRecord(r))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [chogId, loadRecord, bump, profile?.updatedAt]);
  const standing = record && record.chogId === chogId ? record.standing : null;
  const history = record && record.chogId === chogId ? { summary: record.work, failed: false } : null;
  const username = profile?.username ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col">
      <PageHeader
        title={<>Act as your <em>Chog.</em></>}
        description="Your Chog is the member. Sign once with your wallet, pick a Chog you hold, and everything you do is written to that token."
        actions={
          profile ? (
            <>
              <Button asChild variant="secondary" size="compact">
                <Link to="/chog/$chogId" params={{ chogId: String(profile.chogId ?? chogId ?? 0) }}>View Chog record</Link>
              </Button>
              <Button asChild variant="ghost" size="compact">
                <Link to="/applications">Your applications</Link>
              </Button>
            </>
          ) : null
        }
      />
        {chogId ? (
          <div className="grid gap-5 md:grid-cols-[18rem_minmax(0,1fr)] md:items-start">
            <ChogCard chogId={chogId} name={profile?.displayName} xp={standing?.xp ?? 0} rank={standing?.rank} streak={standing?.streak} className="mx-auto md:mx-0" />
            <div className="flex min-w-0 flex-col gap-3">
              <h2 className="t-h3">Today's quests</h2>
              <QuestPanel onXp={() => setBump((n) => n + 1)} />
              {!profile ? <p className="t-meta">Quest XP is saved on Chog #{chogId} now and shows on the leaderboard once you save its passport below.</p> : null}
            </div>
            {standing ? <LevelUpWatcher chogId={chogId} xp={standing.xp} name={profile?.displayName} /> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-8">
      <Section title="Wallet">
        <LazyWalletPanel />
      </Section>

      {sessionAddress ? (
        <Section title="Your Chogs" description="Pick the Chog you act as. Listings, applications, reviews and quests are all done as that Chog.">
          <ActingChogPicker />
        </Section>
      ) : null}

      <Section title={chogId ? `Chog #${chogId} passport` : "Passport"} description={profile ? undefined : "Username, display name and a short bio are required. The face is always the Chog's own art."}>
        {status === "loading" ? <LoadingState label="Loading passport" layout="list" rows={2} /> : null}
        {status === "error" ? <ErrorMessage title="Passport unavailable">{error}</ErrorMessage> : null}
        {status !== "loading" && status !== "error" && !verified ? (
          <EmptyState
            compact
            title={sessionAddress ? "Sign in to edit your profile" : "Connect a wallet to start"}
            body={sessionAddress ? "Sign the Choguild message to prove the wallet is yours. Signing is free." : "Connect a wallet in the Wallet panel, then sign the Choguild message. Signing is free and nothing is sent onchain."}
          />
        ) : null}
        {status === "ready" && verified && !chogId ? (
          <EmptyState compact title="Pick a Chog to act as" body="Passports belong to Chogs. Without a Chog this wallet can view the guild but not act in it." />
        ) : null}
        {status === "ready" && verified && chogId ? (
          <div>
            <ProfileForm key={`${chogId}-${profile?.updatedAt ?? "new"}`} mode={profile ? "update" : "create"} profile={profile} chogTokenIds={[chogId]} />
          </div>
        ) : null}
      </Section>


      <Section title="Contribution history" className="lg:col-span-2">
        {username && chogId && !history ? <LoadingState label="Loading accepted work" layout="list" rows={2} /> : null}
        {history?.failed ? <ErrorMessage title="History unavailable">Accepted work could not be loaded. Reload to try again.</ErrorMessage> : null}
        {history?.summary && history.summary.items.length > 0 ? (
          <ul className="grid gap-3">
            {history.summary.items.map((item) => (
              <li key={item.id} className="surface p-5">
                <Link to="/submissions/$submissionId" params={{ submissionId: item.id }} className="t-h3 hover:underline">
                  {item.title}
                </Link>
                <p className="t-meta mt-1">{item.projectName} · {item.opportunityTitle} · Accepted {formatStamp(item.acceptedAt)}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {!username || (history?.summary && history.summary.items.length === 0) ? (
          <EmptyState
            compact
            title="No accepted work yet"
            body="Work a poster accepts is written to this Chog and shows on its record."
            action={
              <Button asChild variant="secondary" size="compact">
                <Link to="/discover" search={emptyBoardSearch()}>Find work</Link>
              </Button>
            }
          />
        ) : null}
      </Section>
      </div>
    </div>
  );
}
