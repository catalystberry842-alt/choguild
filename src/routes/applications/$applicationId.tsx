import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
    <EmptyState title="This application is not available" body="It does not exist, or it belongs to someone else." />
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
  return (
    <article>
      <h1 className="text-[2.5rem] font-bold tracking-tight text-ink">{application.opportunityTitle}</h1>
      <p className="mt-1 text-sm text-body">{application.projectName}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{APPLICATION_STATUS_LABEL[application.status]}</Badge>
        {application.isDemo ? <Badge tone="warning">Example</Badge> : null}
      </div>
      <p className="mt-3 text-sm text-muted">Sent {formatStamp(application.createdAt)}</p>
      {application.viewer === "creator" && application.username ? (
        <p className="mt-3 text-sm">
          <Link to="/passport/$username" params={{ username: application.username }} className="text-sand">
            {application.displayName} (@{application.username})
          </Link>
        </p>
      ) : null}
      <section className="mt-10 grid gap-4">
        <p className="text-sm leading-7 text-body">{application.introduction}</p>
        <p className="text-sm leading-7 text-body">{application.suitability}</p>
        {application.experience ? <p className="text-sm leading-7 text-body">{application.experience}</p> : null}
        {application.extraAnswer ? <p className="text-sm leading-7 text-body">{application.extraAnswer}</p> : null}
      </section>
      {application.feedback ? <p className="mt-4 text-sm text-body">Message: {application.feedback}</p> : null}
      <ol className="mt-4 grid gap-1 text-sm text-muted">
        {application.history.map((event, index) => (
          <li key={`${event.createdAt}-${index}`}>{APPLICATION_STATUS_LABEL[event.status as keyof typeof APPLICATION_STATUS_LABEL] ?? event.status} · {formatStamp(event.createdAt)}</li>
        ))}
      </ol>
      <div className="mt-4">
        <Link to="/discover/$opportunityId" params={{ opportunityId: application.opportunityId }} className="text-sm text-sand">View opportunity</Link>
      </div>
      {error ? <div className="mt-4"><ErrorMessage title="That did not save">{error}</ErrorMessage></div> : null}
      {application.viewer === "contributor" && ["submitted", "under_review", "shortlisted"].includes(application.status) ? (
        <Button
          className="mt-4"
          variant="secondary"
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
          Withdraw
        </Button>
      ) : null}
      {application.viewer === "creator" && application.status !== "withdrawn" ? (
        <form
          className="mt-10 grid max-w-xl gap-3"
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
          <Field label="Decision" htmlFor="decision">
            <SelectInput id="decision" value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)}>
              {REVIEW_STATUSES.map((value) => <option key={value} value={value}>{APPLICATION_STATUS_LABEL[value]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Message" htmlFor="feedback" hint="The contributor can read this.">
            <TextArea id="feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </Field>
          <Button type="submit" disabled={pending}>{pending ? "Saving" : "Save decision"}</Button>
        </form>
      ) : null}
    </article>
  );
}
