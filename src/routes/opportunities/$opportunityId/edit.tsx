import { createFileRoute, notFound } from "@tanstack/react-router";
import { OpportunityForm } from "@/components/board/opportunity-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getBoardOpportunity } from "@/lib/board/functions";

export const Route = createFileRoute("/opportunities/$opportunityId/edit")({
  loader: async ({ params }) => {
    const opportunity = await getBoardOpportunity({ data: params.opportunityId });
    if (!opportunity || !opportunity.mine || opportunity.isDemo) throw notFound();
    return opportunity;
  },
  staticData: { title: "Edit opportunity", crumb: "Edit" },
  head: () => ({ meta: [{ title: "Edit opportunity · Choguild" }] }),
  component: EditOpportunityPage,
  notFoundComponent: () => (
    <EmptyState title="You cannot edit this opportunity" body="It is missing, it is an example, or it belongs to someone else." />
  ),
});

function EditOpportunityPage() {
  const opportunity = Route.useLoaderData();
  return (
    <div>
      <h1 className="text-[2.5rem] font-bold tracking-tight text-ink">Edit {opportunity.title}</h1>
      <div className="mt-10">
        <OpportunityForm opportunity={opportunity} />
      </div>
    </div>
  );
}
