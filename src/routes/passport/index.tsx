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

export const Route = createFileRoute("/passport/")({
  staticData: { title: "Contributor Passport", crumb: "Passport" },
  head: () => seo({ title: "Passport · Choguild", description: "Claim your Chog Passport: one wallet-signed identity for your Monad contributions.", path: "/passport" }),
  component: PassportPage,
});

function PassportPage() {
  const { status, error, sessionAddress, profile } = usePassport();
  const verified = Boolean(sessionAddress);

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-10 flex flex-col items-center">
      <PageHeader
        eyebrow="Passport"
        title="Your passport"
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
        <PassportRecord profile={profile} address={sessionAddress} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
      <Section title="Wallet">
        <LazyWalletPanel />
      </Section>

      <Section title="Profile" description={profile ? undefined : "Username, display name and a short bio are required."}>
        {status === "loading" ? <LoadingState label="Loading passport" layout="list" rows={2} /> : null}
        {status === "error" ? <ErrorMessage title="Passport unavailable">{error}</ErrorMessage> : null}
        {status === "ready" && !verified ? (
          <EmptyState
            compact
            title="Sign in to edit your profile"
            body="Connect a wallet above, then sign the Choguild message. Signing is free."
          />
        ) : null}
        {status === "ready" && verified ? (
          <div>
            <ProfileForm key={profile?.updatedAt ?? "new"} mode={profile ? "update" : "create"} profile={profile} />
          </div>
        ) : null}
      </Section>

      <Section title="Contribution history" className="lg:col-span-2">
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
      </Section>
      </div>
    </div>
  );
}
