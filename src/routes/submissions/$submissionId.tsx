import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { NotFoundState } from "@/components/layout/not-found";
import { WorkForm } from "@/components/work/work-form";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, SelectInput, TextArea } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-section";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/cn";
import { REVIEW_ACTIONS, WORK_STATUS_LABEL, type ReviewAction } from "@/lib/work/copy";
import { getWorkItem, reviewWorkItem } from "@/lib/work/functions";
import { formatStamp } from "@/lib/passport/format";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/submissions/$submissionId")({
  loader: async ({ params }) => {
    const work = await getWorkItem({ data: params.submissionId });
    if (!work) throw notFound();
    return work;
  },
  staticData: { title: "Submission", crumb: "Submission" },
  pendingComponent: () => <LoadingState label="Loading page" layout="detail" />,
  head: ({ loaderData }) =>
    seo({
      title: loaderData ? `${loaderData.versions.at(-1)?.title ?? "Submission"} · Choguild` : "Submission · Choguild",
      noindex: true,
    }),
  component: SubmissionPage,
  notFoundComponent: () => (
    <NotFoundState title="Submission not found" description="Only the contributor and the publisher can open it." />
  ),
});

function statusTone(status: string): string {
  if (status === "accepted") return "bg-success/10 text-success";
  if (status === "rejected") return "bg-danger/10 text-danger";
  if (status === "changes_requested") return "bg-warning/10 text-warning";
  return "bg-white/[0.06] text-body";
}

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

  async function onReview() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setPending(true);
    const result = await review({ data: { id: work.id, action, comment, privateNote: note } });
    setPending(false);
    setError(result.ok ? null : result.error);
    if (result.ok) await router.invalidate();
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-28 sm:gap-8 sm:pb-10">
      <section className="passport-glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label", statusTone(work.status))}>
            <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            {WORK_STATUS_LABEL[work.status]}
          </span>
          <span className="glass-chip rounded-full px-2.5 py-1 text-label text-ink">{work.projectName}</span>
        </div>
        <h1 className="t-title mt-5 tracking-tight">{latest?.title ?? "Submission"}</h1>
        <p className="t-meta mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to="/discover/$opportunityId" params={{ opportunityId: work.opportunityId }} className="t-link">
            {work.opportunityTitle}
          </Link>
          <span aria-hidden="true">·</span>
          <span>Updated {formatStamp(work.updatedAt)}</span>
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Status" value={WORK_STATUS_LABEL[work.status]} />
          <Stat label="Version" value={String(latest?.version ?? work.versions.length)} />
          <Stat label="Role" value={work.viewer === "reviewer" ? "Reviewer" : "Contributor"} />
          <Stat label="Evidence" value={work.publicEvidence ? "Public" : "Private"} />
        </dl>
      </section>

      {latest?.description ? (
        <FormSection title="What was delivered">
          <p className="t-lead whitespace-pre-wrap text-pretty text-ink">{latest.description}</p>
        </FormSection>
      ) : null}

      <EvidenceSection
        links={latest?.evidenceLinks ?? []}
        repo={latest?.repoUrl}
        document={latest?.documentUrl}
        notes={latest?.notes}
      />

      {canReview ? (
        <form
          id="review-form"
          className="surface grid gap-5 rounded-2xl p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void onReview();
          }}
        >
          <h2 className="t-h2">
            Review <em>work</em>
          </h2>
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
          <Button type="submit" disabled={pending} className="hidden justify-self-start sm:inline-flex">
            {pending ? "Saving…" : confirm ? `Confirm: ${WORK_STATUS_LABEL[action]}` : "Save review"}
          </Button>
        </form>
      ) : null}

      {editable ? (
        <FormSection
          title={work.status === "draft" ? "Finish your draft" : "Send a revision"}
          description="Earlier versions are kept."
        >
          <WorkForm work={work} />
        </FormSection>
      ) : null}

      {work.history.length > 0 ? (
        <FormSection title="History">
          <ol className="flex flex-col gap-4">
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
        </FormSection>
      ) : null}

      {work.versions.length > 1 ? (
        <FormSection title="Earlier versions">
          <ol className="flex flex-col gap-3">
            {work.versions
              .slice(0, -1)
              .reverse()
              .map((version) => (
                <li key={version.version} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                  <p className="t-meta">
                    Version {version.version} · {formatStamp(version.createdAt)}
                  </p>
                  <p className="t-h3 mt-1">{version.title}</p>
                  <p className="t-body mt-1.5">{version.description}</p>
                </li>
              ))}
          </ol>
        </FormSection>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[rgb(8_7_12/0.92)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        {canReview ? (
          <Button className="w-full" disabled={pending} onClick={() => void onReview()}>
            {pending ? "Saving…" : confirm ? `Confirm: ${WORK_STATUS_LABEL[action]}` : "Save review"}
          </Button>
        ) : editable ? (
          <Button
            className="w-full"
            onClick={() => document.getElementById("work-title")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            {work.status === "draft" ? "Continue draft" : "Revise submission"}
          </Button>
        ) : (
          <Button asChild className="w-full" variant="secondary">
            <Link to="/discover/$opportunityId" params={{ opportunityId: work.opportunityId }}>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 sm:px-4">
      <dt className="t-meta">{label}</dt>
      <dd className="mt-1 text-base font-medium text-ink">{value}</dd>
    </div>
  );
}

function EvidenceSection({
  links,
  repo,
  document,
  notes,
}: {
  links: string[];
  repo?: string | null;
  document?: string | null;
  notes?: string | null;
}) {
  const items = [
    ...(repo ? [{ label: "Repository", url: repo }] : []),
    ...(document ? [{ label: "Document", url: document }] : []),
    ...links.filter(Boolean).map((url) => ({ label: "Link", url })),
  ];
  if (items.length === 0 && !notes) return null;
  return (
    <FormSection title="Evidence" description="Links provided by the contributor.">
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.url}>
              <a
                className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-4 text-small text-ink transition-colors hover:border-signal/50 hover:bg-signal/10"
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}: {item.url}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {notes ? <p className="t-body text-pretty">{notes}</p> : null}
    </FormSection>
  );
}
