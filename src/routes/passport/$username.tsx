import { createFileRoute, notFound } from "@tanstack/react-router";
import { PublicPassport } from "@/components/passport/public-passport";
import { usePassport } from "@/components/passport/passport-provider";
import { NotFoundState } from "@/components/layout/not-found";
import { getPublicProfile } from "@/lib/passport/functions";
import { getPublicContributions } from "@/lib/work/functions";
import { seo } from "@/lib/seo";
import { getChogHolding } from "@/lib/chog/functions";
import { LoadingState } from "@/components/ui/loading-state";

export const Route = createFileRoute("/passport/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile({ data: params.username });
    if (!profile) throw notFound();
    const [contributions, chog] = await Promise.all([
      getPublicContributions({ data: params.username }),
      getChogHolding({ data: profile.walletAddress }).catch(() => null),
    ]);
    return { profile, contributions, chog };
  },
  staticData: { title: "Public passport", crumb: "Passport" },
  pendingComponent: () => <LoadingState label="Loading page" layout="detail" />,
  head: ({ loaderData, params }) =>
    seo({
      title: loaderData ? `${loaderData.profile.displayName} · Choguild` : "Passport · Choguild",
      description: loaderData?.profile.biography || "A Chog Passport on Choguild.",
      path: loaderData ? `/passport/${params.username}` : undefined,
      // Unlisted passports and missing usernames stay out of search engines.
      noindex: !loaderData || loaderData.profile.visibility === "unlisted",
    }),
  component: PublicPassportPage,
  notFoundComponent: PassportNotFound,
});

function PublicPassportPage() {
  const { profile, contributions, chog } = Route.useLoaderData();
  const { sessionAddress } = usePassport();
  const owner = Boolean(
    sessionAddress && sessionAddress.toLowerCase() === profile.walletAddress.toLowerCase(),
  );
  return <PublicPassport profile={profile} owner={owner} contributions={contributions} chog={chog} />;
}

function PassportNotFound() {
  return <NotFoundState title="Passport not found" description="Check the username and try again." />;
}
