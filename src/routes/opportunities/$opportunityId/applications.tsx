import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, SelectInput, TextArea } from "@/components/ui/input";
import { APPLICATION_STATUS_LABEL, REVIEW_STATUSES, type ReviewStatus } from "@/lib/board/copy";
import { decideApplication, listBoardReviews } from "@/lib/board/functions";
import type { ApplicationView } from "@/lib/board/types";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/opportunities/$opportunityId/applications")({
  loader: ({ params }) => listBoardReviews({ data: params.opportunityId }),
  staticData: { title: "Applications", crumb: "Applications" },
  head: () => ({ meta: [{ title: "Applications · Choguild" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const result = Route.useLoaderData();
  if (!result.ok) {
    return <EmptyState title="These applications are private" body={result.error} />;
  }
  return (
    <div>
      <h1 className="text-[2.5rem] font-bold tracking-tight text-ink">{result.title}</h1>
      <p className="mt-2 text-sm text-body">Only you can see these applications. Accepting one is a decision you make here. It is not automatic.</p>
      {result.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No applications yet" body="When someone with a passport applies, the application will show up here." />
        </div>
      ) : (
        <ul className="mt-10 grid gap-4">
          {result.items.map((item) => <ReviewCard key={item.id} item={item} />)}
        </ul>
      )}
    </div>
  );
}

function ReviewCard({ item }: { item: ApplicationView }) {
  const router = useRouter();
  const decide = useServerFn(decideApplication);
  const [status, setStatus] = useState<ReviewStatus>(item.status === "withdrawn" ? "submitted" : item.status);
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <li className="rounded-3xl border border-line bg-elevated p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{APPLICATION_STATUS_LABEL[item.status]}</Badge>
        <span className="text-xs text-muted">{formatStamp(item.createdAt)}</span>
      </div>
      <h2 className="mt-2 text-lg font-semibold text-ink">{item.displayName ?? "Passport"}</h2>
      {item.username ? (
        <Link to="/passport/$username" params={{ username: item.username }} className="text-sm text-sand">@{item.username}</Link>
      ) : (
        <p className="text-sm text-muted">No public username</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">{item.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
      <p className="mt-3 text-sm text-body">{item.introduction}</p>
      <p className="mt-2 text-sm text-body">{item.suitability}</p>
      {item.experience ? <p className="mt-2 text-sm text-body">{item.experience}</p> : null}
      {item.extraAnswer ? <p className="mt-2 text-sm text-body">{item.extraAnswer}</p> : null}
      <ul className="mt-2 grid gap-1">
        {item.links.map((link) => (
          <li key={link}><a href={link} className="text-sm text-sand" target="_blank" rel="noreferrer">{link}</a></li>
        ))}
      </ul>
      {item.status === "withdrawn" ? <p className="mt-3 text-sm text-muted">The contributor withdrew this application, so the decision can't be changed.</p> : (
        <form
          className="mt-4 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            void decide({ data: { id: item.id, status, feedback } }).then(async (result) => {
              setPending(false);
              setError(result.ok ? null : result.error);
              if (result.ok) await router.invalidate();
            });
          }}
        >
          {error ? <ErrorMessage title="Status was not saved">{error}</ErrorMessage> : null}
          <Field label="Status" htmlFor={`status-${item.id}`}>
            <SelectInput id={`status-${item.id}`} value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)}>
              {REVIEW_STATUSES.map((value) => <option key={value} value={value}>{APPLICATION_STATUS_LABEL[value]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Message to the contributor" htmlFor={`note-${item.id}`} hint="Optional. They can read this. There is no private note field.">
            <TextArea id={`note-${item.id}`} value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </Field>
          <Button type="submit" disabled={pending}>{pending ? "Saving" : "Save decision"}</Button>
        </form>
      )}
    </li>
  );
}
