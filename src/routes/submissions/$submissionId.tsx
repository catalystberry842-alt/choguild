import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { WorkForm } from "@/components/work/work-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
    <EmptyState title="This submission is not available" body="It does not exist, or you are not the contributor or the opportunity owner." />
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

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{work.projectName}</p>
        <h1 className="mt-3 text-[2.25rem] font-bold tracking-tight text-ink">{latest?.title ?? "Submission"}</h1>
        <p className="mt-2 text-sm text-body">{work.opportunityTitle}</p>
        <div className="mt-3"><Badge>{WORK_STATUS_LABEL[work.status]}</Badge></div>
        <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-body">{latest?.description}</p>
        <Evidence title="Latest evidence" links={latest?.evidenceLinks ?? []} repo={latest?.repoUrl} document={latest?.documentUrl} notes={latest?.notes} />
        {work.versions.length > 1 ? (
          <section className="mt-12">
            <h2 className="text-lg text-ink">Earlier versions</h2>
            <ol className="mt-3 grid gap-4">
              {work.versions.slice(0, -1).map((version) => (
                <li key={version.version} className="rounded-3xl border border-line bg-elevated p-6">
                  <p className="text-xs text-muted">Version {version.version} · {formatStamp(version.createdAt)}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{version.title}</p>
                  <p className="mt-2 text-sm text-body">{version.description}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {editable ? (
          <section className="mt-12">
            <h2 className="text-lg text-ink">{work.status === "draft" ? "Finish the draft" : "Send a revision"}</h2>
            <p className="mt-2 text-sm text-body">A revision is stored as a new version, and the earlier evidence stays.</p>
            <div className="mt-4"><WorkForm work={work} /></div>
          </section>
        ) : null}
      </div>
      <aside className="rounded-3xl border border-line bg-elevated p-6">
        <h2 className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Review history</h2>
        <ol className="mt-3 grid gap-4">
          {work.history.map((event, index) => (
            <li key={`${event.createdAt}-${index}`}>
              <p className="text-sm text-ink">{WORK_STATUS_LABEL[event.toStatus as keyof typeof WORK_STATUS_LABEL] ?? event.toStatus}</p>
              <p className="text-xs text-muted">{formatStamp(event.createdAt)}</p>
              {event.comment ? <p className="mt-1 text-sm text-body">{event.comment}</p> : null}
              {event.privateNote ? <p className="mt-1 text-xs text-muted">Private note: {event.privateNote}</p> : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">External links were supplied by the contributor, so opening one does not verify the work.</p>
        <Link to="/discover/$opportunityId" params={{ opportunityId: work.opportunityId }} className="mt-3 inline-flex text-sm font-semibold text-sand">Opportunity</Link>
        {work.viewer === "reviewer" && (work.status === "submitted" || work.status === "under_review") ? (
          <form
            className="mt-4 grid gap-4"
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
            {error ? <ErrorMessage title="Review was not saved">{error}</ErrorMessage> : null}
            <Field label="Decision" htmlFor="decision">
              <SelectInput id="decision" value={action} onChange={(event) => { setAction(event.target.value as ReviewAction); setConfirm(false); }}>
                {REVIEW_ACTIONS.map((item) => <option key={item} value={item}>{WORK_STATUS_LABEL[item]}</option>)}
              </SelectInput>
            </Field>
            <Field label="Comment for the contributor" htmlFor="comment" hint="Required when you request changes or reject.">
              <TextArea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
            </Field>
            <Field label="Private note" htmlFor="note" hint="Only you can read this.">
              <TextArea id="note" value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
            <Button type="submit" disabled={pending}>{pending ? "Saving" : confirm ? `Confirm ${WORK_STATUS_LABEL[action].toLowerCase()}` : "Review decision"}</Button>
          </form>
        ) : null}
      </aside>
    </article>
  );
}

function Evidence({ title, links, repo, document, notes }: { title: string; links: string[]; repo?: string | null; document?: string | null; notes?: string | null }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg text-ink">{title}</h2>
      <ul className="mt-2 grid gap-1">
        {links.map((url) => <li key={url}><a className="text-sm text-sand" href={url} target="_blank" rel="noreferrer">{url}</a></li>)}
        {repo ? <li><a className="text-sm text-sand" href={repo} target="_blank" rel="noreferrer">Repository · {repo}</a></li> : null}
        {document ? <li><a className="text-sm text-sand" href={document} target="_blank" rel="noreferrer">Document · {document}</a></li> : null}
      </ul>
      {notes ? <p className="mt-2 text-sm text-body">{notes}</p> : null}
    </section>
  );
}
