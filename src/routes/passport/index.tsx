import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfileForm } from "@/components/passport/profile-form";
import { usePassport } from "@/components/passport/passport-provider";
import { WalletPanel } from "@/components/passport/wallet-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { emptyBoardSearch } from "@/lib/board/search";

export const Route = createFileRoute("/passport/")({
  staticData: { title: "Contributor Passport", crumb: "Passport" },
  head: () => ({
    meta: [{ title: "Passport · Choguild" }],
  }),
  component: PassportPage,
});

function PassportPage() {
  const { status, error, sessionAddress, profile } = usePassport();
  const verified = Boolean(sessionAddress);

  return (
    <div>
      <header className="max-w-2xl">
        <h1 className="text-[2.25rem] font-bold tracking-tight text-ink">Contributor Passport</h1>
        <p className="mt-3 text-base leading-7 text-body">
          A passport is the profile other people can read. A wallet address is only an address until
          you sign a message and save a profile.
        </p>
        {profile ? (
          <p className="mt-3">
            <Link to="/applications" className="text-sm font-medium text-sand">
              View your applications
            </Link>
          </p>
        ) : null}
      </header>

      <div className="mt-10 mb-12">
        <Notice title="Wallet and profile are separate">
          Connecting a wallet does not create a passport. Editing requires a signed session for that
          wallet. Choguild does not treat the address as proof of a human identity.
        </Notice>
      </div>

      <Section title="Wallet" description="Use a browser wallet, and disconnecting it never deletes a saved passport.">
        <div className="rounded-3xl border border-line bg-elevated p-6">
          <WalletPanel />
        </div>
      </Section>

      <Section
        title="Contributor profile"
        description={
          profile
            ? "You can edit this passport because this browser session signed for its wallet."
            : "Required fields are username, display name, and a short biography."
        }
      >
        {status === "loading" ? <LoadingState label="Loading passport" /> : null}
        {status === "error" ? <ErrorMessage title="Passport unavailable">{error}</ErrorMessage> : null}
        {status === "ready" && !verified ? (
          <EmptyState
            title="Verify a wallet before creating a profile"
            body="Connect a wallet, then sign the Choguild message to open an edit session, which is free and not a transaction."
          />
        ) : null}
        {status === "ready" && verified ? (
          <div className="rounded-3xl border border-line bg-elevated p-6">
            <ProfileForm
              key={profile?.updatedAt ?? "new"}
              mode={profile ? "update" : "create"}
              profile={profile}
            />
          </div>
        ) : null}
      </Section>

      <Section
        title="Contribution history"
        description="There is no history yet, and reviewed evidence will show up here once submissions exist."
      >
        <EmptyState
          title="No contributions yet"
          body="Saving a passport does not create completed work, reviews, or a reputation score."
          action={
            <Button asChild variant="secondary">
              <Link to="/discover" search={emptyBoardSearch()}>Explore opportunities</Link>
            </Button>
          }
        />
      </Section>
    </div>
  );
}
