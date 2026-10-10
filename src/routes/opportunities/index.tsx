import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { OPPORTUNITY_STATUS_LABEL, type OpportunityStatus } from "@/lib/board/copy";
import { listMyOpportunities } from "@/lib/board/functions";

export const Route = createFileRoute("/opportunities/")({
  loader: () => listMyOpportunities(),
  staticData: { title: "Your opportunities", crumb: "Your opportunities" },
  head: () => ({ meta: [{ title: "Your opportunities · Choguild" }] }),
  component: OwnedPage,
});

function OwnedPage() {
  const result = Route.useLoaderData();
  if (!result.ok) {
    return (
      <EmptyState
        title="Sign in to see your opportunities"
        body={result.error}
        action={<Button asChild><Link to="/passport">Open passport</Link></Button>}
      />
    );
  }
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl text-ink">Your opportunities</h1>
          <p className="mt-2 text-sm text-body">Drafts stay off the public board until you publish them.</p>
        </div>
        <Button asChild><Link to="/opportunities/new">New opportunity</Link></Button>
      </div>
      {result.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing published yet" body="Create an opportunity when you have work for a contributor." />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {result.items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-elevated p-4">
              <Badge>{OPPORTUNITY_STATUS_LABEL[item.status as OpportunityStatus] ?? item.status}</Badge>
              <h2 className="mt-2 text-lg font-semibold text-ink">{item.title}</h2>
              <p className="text-sm text-body">{item.projectName}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }} className="text-sand">View</Link>
                <Link to="/opportunities/$opportunityId/edit" params={{ opportunityId: item.id }} className="text-sand">Edit</Link>
                <Link to="/opportunities/$opportunityId/applications" params={{ opportunityId: item.id }} className="text-sand">Applications</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
