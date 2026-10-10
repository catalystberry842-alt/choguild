import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectInput } from "@/components/ui/input";
import { WORK_STATUSES, WORK_STATUS_LABEL, type WorkStatus } from "@/lib/work/copy";
import { getWorkHome } from "@/lib/work/functions";
import { formatStamp } from "@/lib/passport/format";
import { cn } from "@/lib/cn";

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="mt-3 text-[1.75rem] leading-tight text-ink">Submissions</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
            Send evidence after an application is accepted. A link is something you provided, and it stays unverified until a reviewer accepts it.
          </p>
        </div>
        <Button asChild>
          <Link to="/submissions/new">New submission</Link>
        </Button>
      </header>

      {!data.ok ? (
        <div className="mt-6">
          <EmptyState title="Sign in to submit work" body={data.error} action={<Button asChild><Link to="/passport">Open passport</Link></Button>} />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link to="/submissions" search={{ view: "mine", status: search.status }} className={cn("min-h-11 rounded-lg px-3 text-sm font-semibold", search.view === "mine" ? "bg-secondary text-ink" : "text-body")}>Your work</Link>
            <Link to="/submissions" search={{ view: "review", status: "all" }} className={cn("min-h-11 rounded-lg px-3 text-sm font-semibold", search.view === "review" ? "bg-secondary text-ink" : "text-body")}>To review</Link>
            <SelectInput
              aria-label="Filter by status"
              className="ml-auto max-w-48"
              value={search.status}
              onChange={(event) => void navigate({ to: "/submissions", search: { view: search.view, status: event.target.value } })}
            >
              <option value="all">All statuses</option>
              {WORK_STATUSES.filter((item) => search.view === "review" ? item !== "draft" : true).map((item) => (
                <option key={item} value={item}>{WORK_STATUS_LABEL[item]}</option>
              ))}
            </SelectInput>
          </div>
          {search.view === "mine" && data.eligible.length > 0 ? (
            <p className="mt-4 text-sm text-body">{data.eligible.length} accepted application{data.eligible.length === 1 ? "" : "s"} can take evidence.</p>
          ) : null}
          {visible.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={search.view === "review" ? "Nothing to review" : "No submissions yet"}
                body={search.view === "review" ? "Submissions for opportunities you published will show up here. Drafts stay with the contributor." : "Accepted applications can send work. Rejected and unreviewed applications cannot."}
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elevated">
              {visible.map((item) => (
                <li key={item.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone[item.status]}>{WORK_STATUS_LABEL[item.status]}</Badge>
                    <span className="text-xs text-muted">{formatStamp(item.updatedAt)}</span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-ink">{item.title}</h2>
                  <p className="text-sm text-body">{item.projectName} · {item.opportunityTitle}</p>
                  {item.username ? <p className="mt-1 text-sm text-body">@{item.username}</p> : null}
                  <Link to="/submissions/$submissionId" params={{ submissionId: item.id }} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-sand">Open</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
