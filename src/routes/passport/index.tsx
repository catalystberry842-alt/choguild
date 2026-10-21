import { createFileRoute, Link } from "@tanstack/react-router";
import { PassportRecord } from "@/components/passport/passport-record";
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
import { ChogGallery } from "@/components/chog/chog-bits";
import { getChogHolding } from "@/lib/chog/functions";
import type { ChogHolding } from "@/lib/chog/chog";
import { getPublicContributions } from "@/lib/work/functions";
import type { ContributionSummary } from "@/lib/work/types";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/passport/")({
  staticData: { title: "Contributor Passport", crumb: "Passport" },
  head: () => seo({ title: "Passport · Choguild", description: "Claim your Chog Passport: one wallet-signed identity for your Monad contributions.", path: "/passport" }),
  component: PassportPage,
});

function PassportPage() {
  const { status, error, sessionAddress, profile } = usePassport();
  const verified = Boolean(sessionAddress);
  const loadChog = useServerFn(getChogHolding);
  const [chog, setChog] = useState<{ wallet: string; holding: ChogHolding | null } | null>(null);
  useEffect(() => {
    if (!sessionAddress) return;
    let live = true;
    loadChog({ data: sessionAddress })
      .then((holding) => live && setChog({ wallet: sessionAddress, holding }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [sessionAddress, loadChog]);
  const holding = chog && chog.wallet === sessionAddress ? chog.holding : null;

  // Contribution history: the signed-in passport's real accepted work.
  const loadWork = useServerFn(getPublicContributions);
  const username = profile?.username ?? null;
  const [work, setWork] = useState<{ username: string; summary: ContributionSummary | null; failed: boolean } | null>(null);
  useEffect(() => {
    if (!username) return;
    let live = true;
    loadWork({ data: username })
      .then((summary) => live && setWork({ username, summary, failed: false }))
      .catch(() => live && setWork({ username, summary: null, failed: true }));
    return () => {
      live = false;
    };
  }, [username, loadWork]);
  const history = work && work.username === username ? work : null;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Passport"
        title={<>Your identity in the <em>guild.</em></>}
        description="The public profile people see when they review your work. Sign once with your wallet to create or edit it."
        actions={
          profile ? (
            <>
              <Button asChild variant="secondary" size="compact">
                <Link to="/passport/$username" params={{ username: profile.username }}>View public page</Link>
              </Button>
              <Button asChild variant="ghost" size="compact">
                <Link to="/applications">Your applications</Link>
              </Button>
            </>
          ) : null
        }
      />
        <div className="flex justify-center">
          <PassportRecord profile={profile} address={sessionAddress} />
        </div>
      </div>

      <div className="flex flex-col gap-12">
      <Section title="Wallet">
        <LazyWalletPanel />
      </Section>

      <Section title="Profile" description={profile ? undefined : "Username, display name and a short bio are required."}>
        {status === "loading" ? <LoadingState label="Loading passport" layout="list" rows={2} /> : null}
        {status === "error" ? <ErrorMessage title="Passport unavailable">{error}</ErrorMessage> : null}
        {status !== "loading" && status !== "error" && !verified ? (
          <EmptyState
            compact
            title={sessionAddress ? "Sign in to edit your profile" : "Connect a wallet to start"}
            body={sessionAddress ? "Sign the Choguild message to prove the wallet is yours. Signing is free." : "Connect a wallet in the Wallet panel, then sign the Choguild message. Signing is free and nothing is sent onchain."}
          />
        ) : null}
        {status === "ready" && verified ? (
          <div>
            <ProfileForm key={profile?.updatedAt ?? "new"} mode={profile ? "update" : "create"} profile={profile} chogTokenIds={holding?.tokenIds ?? []} />
          </div>
        ) : null}
      </Section>

      {holding && holding.count > 0 ? (
        <div className="lg:col-span-2">
          <ChogGallery holding={holding} />
        </div>
      ) : null}

      <Section title="Contribution history" className="lg:col-span-2">
        {username && !history ? <LoadingState label="Loading accepted work" layout="list" rows={2} /> : null}
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
            body="Work a publisher accepts shows up here and on your public page."
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
