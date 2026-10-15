import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { OpportunityForm } from "@/components/board/opportunity-form";
import { NotFoundState } from "@/components/layout/not-found";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getBoardOpportunity } from "@/lib/board/functions";

export const Route = createFileRoute("/opportunities/$opportunityId/edit")({
  loader: async ({ params }) => {
    const opportunity = await getBoardOpportunity({ data: params.opportunityId });
    if (!opportunity || !opportunity.mine || opportunity.isDemo) throw notFound();
    return opportunity;
  },
  staticData: { title: "Edit listing", crumb: "Edit" },
  head: () => ({ meta: [{ title: "Edit listing · Choguild" }] }),
  component: EditOpportunityPage,
  notFoundComponent: () => (
    <NotFoundState
      title="You can't edit this listing"
      body="It may be an example, or it belongs to someone else."
      action={
        <Button asChild variant="secondary" size="compact">
          <Link to="/opportunities">Your listings</Link>
        </Button>
      }
    />
  ),
});

function EditOpportunityPage() {
  const opportunity = Route.useLoaderData();
  return (
    <div>
      <PageHeader eyebrow="Edit listing" title={opportunity.title} />
      <div className="mt-10">
        <OpportunityForm opportunity={opportunity} />
      </div>
    </div>
  );
}
