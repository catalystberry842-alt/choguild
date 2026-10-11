import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicPassport } from "@/components/passport/public-passport";
import { usePassport } from "@/components/passport/passport-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicProfile } from "@/lib/passport/functions";
import { getPublicContributions } from "@/lib/work/functions";

export const Route = createFileRoute("/passport/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile({ data: params.username });
    if (!profile) throw notFound();
    const contributions = await getPublicContributions({ data: params.username });
    return { profile, contributions };
  },
  staticData: { title: "Public passport", crumb: "Passport" },
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
    <EmptyState
      title="Passport not found"
      body="Check the username and try again."
    />
  );
}
