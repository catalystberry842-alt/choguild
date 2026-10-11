import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { WorkForm } from "@/components/work/work-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, SelectInput, TextArea } from "@/components/ui/input";
import { REVIEW_ACTIONS, WORK_STATUS_LABEL, type ReviewAction } from "@/lib/work/copy";
import { getWorkItem, reviewWorkItem } from "@/lib/work/functions";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/submissions/$submissionId")({
  loader: async ({ params }) => {
    const work = await getWorkItem({ data: params.submissionId });
    if (!work) throw notFound();
    return work;
  },
  staticData: { title: "Submission", crumb: "Submission" },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.versions.at(-1)?.title ?? "Submission"} · Choguild` : "Submission · Choguild" }],
  }),
  component: SubmissionPage,
  notFoundComponent: () => (
    <EmptyState title="Submission not found" body="Only the contributor and the publisher can open it." />
  ),
});

function SubmissionPage() {
  const work = Route.useLoaderData();
  const latest = work.versions[work.versions.length - 1];
  const router = useRouter();
  const review = useServerFn(reviewWorkItem);
  const [action, setAction] = useState<ReviewAction>("under_review");
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const editable = work.viewer === "contributor" && (work.status === "draft" || work.status === "changes_requested");

  const canReview = work.viewer === "reviewer" && (work.status === "submitted" || work.status === "under_review");

  return (
    <article className="flex flex-col gap-10">
      <PageHeader eyebrow={work.projectName} title={latest?.title ?? "Submission"}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{WORK_STATUS_LABEL[work.status]}</Badge>
          <Link to="/discover/$opportunityId" params={{ opportunityId: work.opportunityId }} className="t-link text-sm">
            {work.opportunityTitle}
          </Link>
        </div>
      </PageHeader>

      <section className="surface flex flex-col gap-6 p-6 sm:p-8">
        {latest?.description ? <p className="t-lead whitespace-pre-wrap">{latest.description}</p> : null}
        <Evidence links={latest?.evidenceLinks ?? []} repo={latest?.repoUrl} document={latest?.documentUrl} notes={latest?.notes} />
      </section>

      {canReview ? (
        <form
          className="surface grid gap-5 p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirm) {
              setConfirm(true);
              return;
            }
            setPending(true);
            void review({ data: { id: work.id, action, comment, privateNote: note } }).then(async (result) => {
              setPending(false);
              setError(result.ok ? null : result.error);
              if (result.ok) await router.invalidate();
            });
          }}
        >
          <h2 className="t-h2">Review</h2>
          {error ? <ErrorMessage title="That didn't save">{error}</ErrorMessage> : null}
          <Field label="Decision" htmlFor="decision">
            <SelectInput
              id="decision"
              value={action}
              onChange={(event) => {
                setAction(event.target.value as ReviewAction);
                setConfirm(false);
              }}
            >
              {REVIEW_ACTIONS.map((item) => (
                <option key={item} value={item}>
                  {WORK_STATUS_LABEL[item]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Comment" htmlFor="comment" hint="The contributor sees this. Required for changes or rejection.">
            <TextArea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
          </Field>
          <Field label="Private note" htmlFor="note" hint="Only you see this.">
            <TextArea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Button type="submit" disabled={pending} className="justify-self-start">
            {pending ? "Saving…" : confirm ? `Confirm: ${WORK_STATUS_LABEL[action]}` : "Save review"}
          </Button>
        </form>
      ) : null}

      {editable ? (
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="t-h2">{work.status === "draft" ? "Finish your draft" : "Send a revision"}</h2>
            <p className="t-body mt-1.5">Earlier versions are kept.</p>
          </div>
          <WorkForm work={work} />
        </section>
      ) : null}

      {work.history.length > 0 ? (
        <section>
          <h2 className="t-h3">History</h2>
          <ol className="mt-4 flex flex-col gap-4">
            {work.history.map((event, index) => (
              <li key={`${event.createdAt}-${index}`} className="border-l border-line pl-4">
                <p className="t-body text-ink">
                  {WORK_STATUS_LABEL[event.toStatus as keyof typeof WORK_STATUS_LABEL] ?? event.toStatus}
                  <span className="t-meta ml-2">{formatStamp(event.createdAt)}</span>
                </p>
                {event.comment ? <p className="t-body mt-1">{event.comment}</p> : null}
                {event.privateNote ? <p className="t-meta mt-1">Private note: {event.privateNote}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {work.versions.length > 1 ? (
        <section>
          <h2 className="t-h3">Earlier versions</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {work.versions
              .slice(0, -1)
              .reverse()
              .map((version) => (
                <li key={version.version} className="surface p-5">
                  <p className="t-meta">
                    Version {version.version} · {formatStamp(version.createdAt)}
                  </p>
                  <p className="t-h3 mt-1">{version.title}</p>
                  <p className="t-body mt-1.5">{version.description}</p>
                </li>
              ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}

function Evidence({ links, repo, document, notes }: { links: string[]; repo?: string | null; document?: string | null; notes?: string | null }) {
  const items = [
    ...(repo ? [{ label: "Repository", url: repo }] : []),
    ...(document ? [{ label: "Document", url: document }] : []),
    ...links.map((url) => ({ label: "Link", url })),
  ];
  if (items.length === 0 && !notes) return null;
  return (
    <div className="border-t border-line pt-6">
      <p className="t-meta">Evidence · links are provided by the contributor</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.url} className="flex gap-3 text-sm">
            <span className="t-meta w-20 shrink-0 pt-px">{item.label}</span>
            <a className="t-link min-w-0 break-all" href={item.url} target="_blank" rel="noreferrer">
              {item.url}
            </a>
          </li>
        ))}
      </ul>
      {notes ? <p className="t-body mt-4">{notes}</p> : null}
    </div>
  );
}
