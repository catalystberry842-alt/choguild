import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicPassport } from "@/components/passport/public-passport";
import { usePassport } from "@/components/passport/passport-provider";
import { NotFoundState } from "@/components/layout/not-found";
import { Button } from "@/components/ui/button";
import { getPublicProfile } from "@/lib/passport/functions";
import { getPublicContributions } from "@/lib/work/functions";

export const Route = createFileRoute("/passport/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile({ data: params.username });
    if (!profile) throw notFound();
    const contributions = await getPublicContributions({ data: params.username });
    return { profile, contributions };
  },
  staticData: { title: "Public Passport", crumb: "Passport" },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.profile.displayName} · Choguild` : "Passport · Choguild" }],
  }),
  component: PublicPassportPage,
  notFoundComponent: PassportNotFound,
});

function PublicPassportPage() {
  const { profile, contributions } = Route.useLoaderData();
  const { sessionAddress } = usePassport();
  const owner = Boolean(
    sessionAddress && sessionAddress.toLowerCase() === profile.walletAddress.toLowerCase(),
  );
  return <PublicPassport profile={profile} owner={owner} contributions={contributions} />;
}

function PassportNotFound() {
  return (
    <NotFoundState
      title="Passport not found"
      body="Check the username and try again."
      action={
        <Button asChild variant="secondary" size="compact">
          <Link to="/ranking">Browse the ranking</Link>
        </Button>
      }
    />
  );
}
