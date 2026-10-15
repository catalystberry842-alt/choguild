import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, SelectInput, TextArea } from "@/components/ui/input";
import { APPLICATION_STATUS_LABEL, REVIEW_STATUSES, type ReviewStatus } from "@/lib/board/copy";
import { decideApplication, getBoardApplication, withdrawBoardApplication } from "@/lib/board/functions";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/applications/$applicationId")({
  loader: async ({ params }) => {
    const application = await getBoardApplication({ data: params.applicationId });
    if (!application) throw notFound();
    return application;
  },
  staticData: { title: "Application", crumb: "Application" },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.opportunityTitle} · Application` : "Application · Choguild" }],
  }),
  component: ApplicationPage,
  notFoundComponent: () => (
    <EmptyState title="Application not found" body="It may have been removed, or it belongs to someone else." />
  ),
});

function ApplicationPage() {
  const application = Route.useLoaderData();
  const router = useRouter();
  const withdraw = useServerFn(withdrawBoardApplication);
  const decide = useServerFn(decideApplication);
  const [status, setStatus] = useState<ReviewStatus>(application.status === "withdrawn" ? "submitted" : application.status);
  const [feedback, setFeedback] = useState(application.feedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const answers = [
    ["Introduction", application.introduction],
    ["Why they fit", application.suitability],
    ["Experience", application.experience],
    ["Answer", application.extraAnswer],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <article className="flex flex-col gap-10">
      <PageHeader eyebrow={application.projectName} title={application.opportunityTitle}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={application.status === "accepted" ? "olive" : application.status === "rejected" ? "danger" : "neutral"}>
            {APPLICATION_STATUS_LABEL[application.status]}
          </Badge>
          <span className="t-meta">Sent {formatStamp(application.createdAt)}</span>
          {application.viewer === "creator" && application.username ? (
            <Link to="/passport/$username" params={{ username: application.username }} className="t-link text-sm">
              {application.displayName} · @{application.username}
            </Link>
          ) : null}
        </div>
      </PageHeader>

      <dl className="surface flex flex-col gap-6 p-6 sm:p-8">
        {answers.map(([label, text]) => (
          <div key={label}>
            <dt className="t-meta">{label}</dt>
            <dd className="t-lead mt-1.5 whitespace-pre-wrap">{text}</dd>
          </div>
        ))}
        {application.feedback ? (
          <div className="border-t border-line pt-6">
            <dt className="t-meta">Message from the publisher</dt>
            <dd className="t-lead mt-1.5">{application.feedback}</dd>
          </div>
        ) : null}
      </dl>

      {application.history.length > 0 ? (
        <section>
          <h2 className="t-h3">History</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {application.history.map((event, index) => (
              <li key={`${event.createdAt}-${index}`} className="t-body flex gap-3">
                <span className="text-ink">
                  {APPLICATION_STATUS_LABEL[event.status as keyof typeof APPLICATION_STATUS_LABEL] ?? event.status}
                </span>
                <span className="t-meta self-center">{formatStamp(event.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {error ? <ErrorMessage title="That didn't save">{error}</ErrorMessage> : null}

      {application.viewer === "creator" && application.status !== "withdrawn" ? (
        <form
          className="surface grid gap-5 p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            void decide({ data: { id: application.id, status, feedback } }).then(async (result) => {
              setPending(false);
              setError(result.ok ? null : result.error);
              if (result.ok) await router.invalidate();
            });
          }}
        >
          <h2 className="t-h2">Your decision</h2>
          <Field label="Status" htmlFor="decision">
            <SelectInput id="decision" value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)}>
              {REVIEW_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {APPLICATION_STATUS_LABEL[value]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Message" htmlFor="feedback" hint="The contributor sees this.">
            <TextArea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </Field>
          <Button type="submit" disabled={pending} className="justify-self-start">
            {pending ? "Saving…" : "Save decision"}
          </Button>
        </form>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="secondary" size="compact">
          <Link to="/discover/$opportunityId" params={{ opportunityId: application.opportunityId }}>View opportunity</Link>
        </Button>
        {application.viewer === "contributor" && ["submitted", "under_review", "shortlisted"].includes(application.status) ? (
          <Button
            variant="ghost"
            size="compact"
            disabled={pending}
            onClick={() => {
              setPending(true);
              void withdraw({ data: application.id }).then(async (result) => {
                setPending(false);
                setError(result.ok ? null : result.error);
                if (result.ok) await router.invalidate();
              });
            }}
          >
            Withdraw application
          </Button>
        ) : null}
      </div>
    </article>
  );
}
