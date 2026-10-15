import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { APPLICATION_STATUS_LABEL } from "@/lib/board/copy";
import { listBoardApplications } from "@/lib/board/functions";
import { emptyBoardSearch } from "@/lib/board/search";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/applications/")({
  loader: () => listBoardApplications(),
  staticData: { title: "Applications", crumb: "Applications" },
  head: () => ({ meta: [{ title: "Applications · Choguild" }] }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const result = Route.useLoaderData();

  return (
    <div>
      <PageHeader eyebrow="Applications" title="Applications" description="Everything you've applied to and where it stands." />

      <div className="mt-10">
        {!result.ok ? (
          <EmptyState
            title="Sign in to see your applications"
            action={
              <Button asChild size="compact">
                <Link to="/passport">Open Passport</Link>
              </Button>
            }
          />
        ) : result.items.length === 0 ? (
          <EmptyState
            title="No applications yet"
            body="Apply to an open opportunity and it will show up here."
            action={
              <Button asChild variant="secondary" size="compact">
                <Link to="/discover" search={emptyBoardSearch()}>Find work</Link>
              </Button>
            }
          />
        ) : (
          <ul className="surface row-list overflow-hidden">
            {result.items.map((item) => (
              <li key={item.id}>
                <Link to="/applications/$applicationId" params={{ applicationId: item.id }} className="row-link">
                  <span className="min-w-0 flex-1">
                    <span className="t-h3 block truncate">{item.opportunityTitle}</span>
                    <span className="t-meta mt-1 block truncate">
                      {item.projectName} · {formatStamp(item.createdAt)}
                    </span>
                    {item.feedback ? <span className="t-body mt-2 block">{item.feedback}</span> : null}
                  </span>
                  <Badge tone={item.status === "accepted" ? "olive" : item.status === "rejected" ? "danger" : "neutral"}>
                    {APPLICATION_STATUS_LABEL[item.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
