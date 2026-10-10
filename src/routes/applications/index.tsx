import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { APPLICATION_STATUS_LABEL } from "@/lib/board/copy";
import { listBoardApplications } from "@/lib/board/functions";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/applications/")({
  loader: () => listBoardApplications(),
  staticData: { title: "Applications", crumb: "Applications" },
  head: () => ({ meta: [{ title: "Applications · Choguild" }] }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const result = Route.useLoaderData();
  if (!result.ok) {
    return (
      <EmptyState
        title="Sign in to see applications"
        body={result.error}
        action={<Button asChild><Link to="/passport">Open passport</Link></Button>}
      />
    );
  }
  return (
    <div>
      <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink">Your applications</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-body">
        A submitted application is with the creator. It is not an acceptance.
      </p>
      {result.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No applications yet"
            body="When you apply to an open opportunity, it will be listed here."
            action={<Button asChild><Link to="/discover" search={{ q: "", category: "all", skills: [], compensation: "all", status: "open", sort: "newest", page: 1 }}>Browse the board</Link></Button>}
          />
        </div>
      ) : (
        <ul className="mt-10 grid gap-4">
          {result.items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-elevated px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-ink">{item.opportunityTitle}</h2>
                <Badge>{APPLICATION_STATUS_LABEL[item.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-body">{item.projectName} · {formatStamp(item.createdAt)}</p>
              {item.feedback ? <p className="mt-2 text-sm leading-6 text-body">{item.feedback}</p> : null}
              <div className="mt-3 flex flex-wrap gap-4">
                <Link to="/discover/$opportunityId" params={{ opportunityId: item.opportunityId }} className="text-sm font-semibold text-sand">Opportunity</Link>
                <Link to="/applications/$applicationId" params={{ applicationId: item.id }} className="text-sm font-semibold text-sand">Application</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
