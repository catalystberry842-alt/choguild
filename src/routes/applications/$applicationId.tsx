import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { NotFoundState } from "@/components/layout/not-found";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, SelectInput, TextArea } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { LoadingState } from "@/components/ui/loading-state";
import { APPLICATION_STATUS_LABEL, REVIEW_STATUSES, type ReviewStatus } from "@/lib/board/copy";
import { decideApplication, getBoardApplication, withdrawBoardApplication } from "@/lib/board/functions";
import { cn } from "@/lib/cn";
import { formatStamp } from "@/lib/passport/format";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/applications/$applicationId")({
  loader: async ({ params }) => {
    const application = await getBoardApplication({ data: params.applicationId });
    if (!application) throw notFound();
    return application;
  },
  staticData: { title: "Application", crumb: "Application" },
  pendingComponent: () => <LoadingState label="Loading page" layout="detail" />,
  head: ({ loaderData }) =>
    seo({ title: loaderData ? `${loaderData.opportunityTitle} · Application` : "Application · Choguild", noindex: true }),
  component: ApplicationPage,
  notFoundComponent: () => (
    <NotFoundState title="Application not found" description="It may have been removed, or it belongs to someone else." />
  ),
});

function statusTone(status: string): string {
  if (status === "accepted") return "bg-success/10 text-success";
  if (status === "rejected" || status === "withdrawn") return "bg-danger/10 text-danger";
  return "bg-line/50 text-body";
}

function ApplicationPage() {
  const application = Route.useLoaderData();
  const router = useRouter();
  const withdraw = useServerFn(withdrawBoardApplication);
  const decide = useServerFn(decideApplication);
  const [status, setStatus] = useState<ReviewStatus>(
    application.status === "withdrawn" ? "submitted" : (application.status as ReviewStatus),
  );
  const [feedback, setFeedback] = useState(application.feedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const answers = [
    ["Introduction", application.introduction],
    ["Why they fit", application.suitability],
    ["Experience", application.experience],
    ["Answer", application.extraAnswer],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const canWithdraw =
    application.viewer === "contributor" &&
    ["submitted", "under_review", "shortlisted"].includes(application.status);
  const canDecide = application.viewer === "creator" && application.status !== "withdrawn";

  async function onWithdraw() {
    setPending(true);
    const result = await withdraw({ data: application.id });
    setPending(false);
    setError(result.ok ? null : result.error);
    if (result.ok) await router.invalidate();
  }

  async function onDecide() {
    setPending(true);
    const result = await decide({ data: { id: application.id, status, feedback } });
    setPending(false);
    setError(result.ok ? null : result.error);
    if (result.ok) await router.invalidate();
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28 sm:gap-8 sm:pb-10">
      <section className="passport-glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label", statusTone(application.status))}>
            <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            {APPLICATION_STATUS_LABEL[application.status]}
          </span>
          <span className="glass-chip rounded-full px-2.5 py-1 text-label text-ink">{application.projectName}</span>
        </div>
        <h1 className="t-title mt-5 tracking-tight">{application.opportunityTitle}</h1>
        <p className="t-meta mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Sent {formatStamp(application.createdAt)}</span>
          {application.viewer === "creator" && application.username ? (
            <>
              <span aria-hidden="true">·</span>
              <Link to="/passport/$username" params={{ username: application.username }} className="t-link">
                {application.displayName} · @{application.username}
              </Link>
            </>
          ) : null}
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Status" value={APPLICATION_STATUS_LABEL[application.status]} />
          <Stat label="Viewer" value={application.viewer === "creator" ? "Publisher" : "Applicant"} />
          <Stat label="Skills" value={application.skills.length ? String(application.skills.length) : "—"} />
        </dl>
      </section>

      {answers.map(([label, text]) => (
        <FormSection key={label} title={label}>
          <p className="t-lead whitespace-pre-wrap text-pretty text-ink">{text}</p>
        </FormSection>
      ))}

      {application.links.length > 0 ? (
        <FormSection title="Links">
          <ul className="flex flex-col gap-2">
            {application.links.map((url) => (
              <li key={url}>
                <a className="t-link break-all text-base" href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </FormSection>
      ) : null}

      {application.feedback ? (
        <FormSection title="Message from the publisher">
          <p className="t-lead text-pretty text-ink">{application.feedback}</p>
        </FormSection>
      ) : null}

      {application.history.length > 0 ? (
        <FormSection title="History">
          <ol className="flex flex-col gap-3">
            {application.history.map((event, index) => (
              <li key={`${event.createdAt}-${index}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l border-line pl-4">
                <span className="text-base text-ink">
                  {APPLICATION_STATUS_LABEL[event.status as keyof typeof APPLICATION_STATUS_LABEL] ?? event.status}
                </span>
                <span className="t-meta">{formatStamp(event.createdAt)}</span>
              </li>
            ))}
          </ol>
        </FormSection>
      ) : null}

      {error ? <ErrorMessage title="That didn't save">{error}</ErrorMessage> : null}

      {canDecide ? (
        <form
          id="decision-form"
          className="surface grid gap-5 rounded-2xl p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void onDecide();
          }}
        >
          <h2 className="t-h2">
            Your <em>decision</em>
          </h2>
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
          <Button type="submit" disabled={pending} className="hidden justify-self-start sm:inline-flex">
            {pending ? "Saving…" : "Save decision"}
          </Button>
        </form>
      ) : null}

      <div className="hidden flex-wrap items-center gap-3 sm:flex">
        <Button asChild variant="secondary">
          <Link to="/discover/$opportunityId" params={{ opportunityId: application.opportunityId }}>
            View opportunity
          </Link>
        </Button>
        {canWithdraw ? (
          <Button variant="ghost" disabled={pending} onClick={() => void onWithdraw()}>
            Withdraw application
          </Button>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[rgb(8_7_12/0.92)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        {canDecide ? (
          <Button disabled={pending} onClick={() => void onDecide()}>
            {pending ? "Saving…" : "Save decision"}
          </Button>
        ) : canWithdraw ? (
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="secondary">
              <Link to="/discover/$opportunityId" params={{ opportunityId: application.opportunityId }}>
                Opportunity
              </Link>
            </Button>
            <Button disabled={pending} onClick={() => void onWithdraw()}>
              {pending ? "…" : "Withdraw"}
            </Button>
          </div>
        ) : (
          <Button asChild>
            <Link to="/discover/$opportunityId" params={{ opportunityId: application.opportunityId }}>
              View opportunity
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-canvas/60 px-3 py-3 sm:px-4">
      <dt className="t-meta">{label}</dt>
      <dd className="mt-1 text-base font-medium text-ink">{value}</dd>
    </div>
  );
}
