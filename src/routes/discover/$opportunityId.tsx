import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { OpportunityDetailView } from "@/components/board/opportunity-detail";
import { NotFoundState } from "@/components/layout/not-found";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { getBoardOpportunity } from "@/lib/board/functions";
import { emptyBoardSearch } from "@/lib/board/search";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/discover/$opportunityId")({
  loader: async ({ params }) => {
    const opportunity = await getBoardOpportunity({ data: params.opportunityId });
    if (!opportunity) throw notFound();
    return opportunity;
  },
  staticData: { title: "Opportunity", crumb: "Discover" },
  pendingComponent: () => <LoadingState label="Loading page" layout="detail" />,
  head: ({ loaderData, params }) =>
    seo({
      title: loaderData ? `${loaderData.title} · Choguild` : "Opportunity · Choguild",
      description: loaderData?.summary,
      path: loaderData ? `/discover/${params.opportunityId}` : undefined,
      noindex: !loaderData,
    }),
  component: OpportunityPage,
  notFoundComponent: () => (
    <NotFoundState
      title="Opportunity not found"
      description="It may still be a draft, or it was removed."
      actions={
        <Button asChild variant="secondary" size="compact">
          <Link to="/discover" search={emptyBoardSearch()}>
            Back to Discover
          </Link>
        </Button>
      }
    />
  ),
});

function OpportunityPage() {
  return <OpportunityDetailView opportunity={Route.useLoaderData()} />;
}
