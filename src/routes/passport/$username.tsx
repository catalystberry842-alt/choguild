import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicPassport } from "@/components/passport/public-passport";
import { usePassport } from "@/components/passport/passport-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicProfile } from "@/lib/passport/functions";
import { getPublicContributions } from "@/lib/work/functions";
import { seo } from "@/lib/seo";
import { LoadingState } from "@/components/ui/loading-state";

export const Route = createFileRoute("/passport/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile({ data: params.username });
    if (!profile) throw notFound();
    const contributions = await getPublicContributions({ data: params.username });
    return { profile, contributions };
  },
  staticData: { title: "Public passport", crumb: "Passport" },
  pendingComponent: () => <LoadingState label="Loading page" layout="detail" />,
  head: ({ loaderData, params }) =>
    seo({
      title: loaderData ? `${loaderData.profile.displayName} · Choguild` : "Passport · Choguild",
      description: loaderData?.profile.biography || "A Chog Passport on Choguild.",
      path: `/passport/${params.username}`,
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
