import { createFileRoute, notFound } from "@tanstack/react-router";
import { OpportunityForm } from "@/components/board/opportunity-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getBoardOpportunity } from "@/lib/board/functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/opportunities/$opportunityId/edit")({
  loader: async ({ params }) => {
    const opportunity = await getBoardOpportunity({ data: params.opportunityId });
    if (!opportunity || !opportunity.mine) throw notFound();
    return opportunity;
  },
  staticData: { title: "Edit opportunity", crumb: "Edit" },
  head: () => seo({ title: "Edit opportunity · Choguild", noindex: true }),
  component: EditOpportunityPage,
  notFoundComponent: () => (
    <EmptyState title="You can't edit this listing" body="It may be an example, or it belongs to someone else." />
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
