import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { OPPORTUNITY_STATUS_LABEL, type OpportunityStatus } from "@/lib/board/copy";
import { listMyOpportunities } from "@/lib/board/functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/opportunities/")({
  loader: () => listMyOpportunities(),
  staticData: { title: "Your listings", crumb: "Your listings" },
  head: () => seo({ title: "Your opportunities · Choguild", noindex: true }),
  component: OwnedPage,
});

function OwnedPage() {
  const result = Route.useLoaderData();

  return (
    <div>
      <PageHeader
        eyebrow="Listings"
        title="Your listings"
        description="Work you've published. Drafts stay off the board until you publish them."
        actions={
          result.ok ? (
            <Button asChild size="compact">
              <Link to="/opportunities/new">Publish work</Link>
            </Button>
          ) : null
        }
      />

      <div className="mt-10">
        {!result.ok ? (
          <EmptyState
            title="Sign in to see your listings"
            action={
              <Button asChild size="compact">
                <Link to="/passport">Open passport</Link>
              </Button>
            }
          />
        ) : result.items.length === 0 ? (
          <EmptyState title="Nothing published yet" body="Post work when you need a contributor." />
        ) : (
          <ul className="flex flex-col gap-4">
            {result.items.map((item) => (
              <li key={item.id} className="surface p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="t-h3">{item.title}</h2>
                    <p className="t-meta mt-1">{item.projectName}</p>
                  </div>
                  <Badge tone={item.status === "open" ? "olive" : "neutral"}>
                    {OPPORTUNITY_STATUS_LABEL[item.status as OpportunityStatus] ?? item.status}
                  </Badge>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button asChild variant="secondary" size="compact">
                    <Link to="/opportunities/$opportunityId/applications" params={{ opportunityId: item.id }}>Applications</Link>
                  </Button>
                  <Button asChild variant="ghost" size="compact">
                    <Link to="/opportunities/$opportunityId/edit" params={{ opportunityId: item.id }}>Edit</Link>
                  </Button>
                  <Button asChild variant="ghost" size="compact">
                    <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }}>View</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
