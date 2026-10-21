import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { APPLICATION_STATUS_LABEL } from "@/lib/board/copy";
import { listBoardApplications } from "@/lib/board/functions";
import { emptyBoardSearch } from "@/lib/board/search";
import { formatStamp } from "@/lib/passport/format";
import { seo } from "@/lib/seo";
import { LoadingState } from "@/components/ui/loading-state";

export const Route = createFileRoute("/applications/")({
  loader: () => listBoardApplications(),
  staticData: { title: "Applications", crumb: "Applications" },
  pendingComponent: () => <LoadingState label="Loading page" layout="list" />,
  head: () => seo({ title: "Applications · Choguild", noindex: true }),
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
            body="Connect your wallet and sign once on your passport to track the work you applied for."
            action={
              <Button asChild size="compact">
                <Link to="/passport">Sign in on passport</Link>
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
          <ul className="grid gap-3">
            {result.items.map((item) => (
              <li key={item.id}>
                <Link
                  to="/applications/$applicationId"
                  params={{ applicationId: item.id }}
                  className="surface flex items-start gap-4 rounded-[1.25rem] p-5 transition-colors hover:border-signal/40 sm:p-6"
                >
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
