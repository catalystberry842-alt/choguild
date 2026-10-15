import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SelectInput } from "@/components/ui/input";
import { WORK_STATUSES, WORK_STATUS_LABEL, type WorkStatus } from "@/lib/work/copy";
import { getWorkHome } from "@/lib/work/functions";
import { formatStamp } from "@/lib/passport/format";

type Search = { view: "mine" | "review"; status: string };

export const Route = createFileRoute("/submissions/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    view: search.view === "review" ? "review" : "mine",
    status: typeof search.status === "string" ? search.status : "all",
  }),
  loaderDeps: ({ search }) => search,
  loader: () => getWorkHome(),
  staticData: { title: "Submissions", crumb: "Submissions" },
  head: () => ({ meta: [{ title: "Submissions · Choguild" }] }),
  component: SubmissionsPage,
});

const tone: Record<WorkStatus, "sand" | "olive" | "warning" | "danger" | "neutral"> = {
  draft: "neutral",
  submitted: "sand",
  under_review: "sand",
  accepted: "olive",
  changes_requested: "warning",
  rejected: "danger",
};

function SubmissionsPage() {
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const rows = search.view === "review" ? data.review : data.mine;
  const visible = rows.filter((item) => search.status === "all" || item.status === search.status);

  return (
    <div>
      <PageHeader
        eyebrow="03 — Submissions"
        title="Submissions"
        description="Send evidence for accepted work, and review work sent to your listings."
        actions={
          data.ok && data.eligible.length > 0 ? (
            <Button asChild size="compact">
              <Link to="/submissions/new">Submit work</Link>
            </Button>
          ) : null
        }
      />

      {!data.ok ? (
        <div className="mt-10">
          <EmptyState
            title="Sign in to see submissions"
            action={
              <Button asChild size="compact">
                <Link to="/passport">Open Passport</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <nav className="seg" aria-label="Submissions view">
              <Link
                to="/submissions"
                search={{ view: "mine", status: search.status }}
                aria-current={search.view === "mine" ? "page" : undefined}
                className="seg-item"
              >
                Your work
              </Link>
              <Link
                to="/submissions"
                search={{ view: "review", status: "all" }}
                aria-current={search.view === "review" ? "page" : undefined}
                className="seg-item"
              >
                To review
              </Link>
            </nav>
            <SelectInput
              aria-label="Filter by status"
              className="ml-auto max-w-44 min-h-10"
              value={search.status}
              onChange={(event) => void navigate({ to: "/submissions", search: { view: search.view, status: event.target.value } })}
            >
              <option value="all">All statuses</option>
              {WORK_STATUSES.filter((item) => (search.view === "review" ? item !== "draft" : true)).map((item) => (
                <option key={item} value={item}>
                  {WORK_STATUS_LABEL[item]}
                </option>
              ))}
            </SelectInput>
          </div>

          {visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title={search.view === "review" ? "Nothing to review" : "No submissions yet"}
                body={
                  search.view === "review"
                    ? "Work sent to your listings appears here."
                    : data.eligible.length > 0
                      ? `You have ${data.eligible.length} accepted application${data.eligible.length === 1 ? "" : "s"} ready for evidence.`
                      : "Once a publisher accepts your application, you can submit work here."
                }
              />
            </div>
          ) : (
            <ul className="surface row-list mt-6 overflow-hidden">
              {visible.map((item) => (
                <li key={item.id}>
                  <Link to="/submissions/$submissionId" params={{ submissionId: item.id }} className="row-link">
                    <span className="min-w-0 flex-1">
                      <span className="t-h3 block truncate">{item.title}</span>
                      <span className="t-meta mt-1 block truncate">
                        {item.projectName} · {item.opportunityTitle}
                        {item.username ? ` · @${item.username}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge tone={tone[item.status]}>{WORK_STATUS_LABEL[item.status]}</Badge>
                      <span className="t-meta">{formatStamp(item.updatedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
