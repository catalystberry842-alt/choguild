import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
    return (
      <div>
        <PageHeader title="Applications" />
        <div className="mt-10">
          <EmptyState title="Only the publisher can see these" />
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader eyebrow="Applications" title={result.title} description="Only you can see these. Nothing is accepted until you decide." />
      <div className="mt-10">
        {result.items.length === 0 ? (
          <EmptyState title="No applications yet" />
        ) : (
          <ul className="flex flex-col gap-4">
            {result.items.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
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
  const answers = [item.introduction, item.suitability, item.experience, item.extraAnswer].filter(Boolean);

  return (
    <li className="surface flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="t-h3">{item.displayName ?? "Passport"}</h2>
          <p className="t-meta mt-1">
            {item.username ? (
              <Link to="/passport/$username" params={{ username: item.username }} className="t-link">
                @{item.username}
              </Link>
            ) : (
              "No public username"
            )}
            {" · "}
            {formatStamp(item.createdAt)}
          </p>
        </div>
        <Badge tone={item.status === "accepted" ? "olive" : item.status === "rejected" ? "danger" : "neutral"}>
          {APPLICATION_STATUS_LABEL[item.status]}
        </Badge>
      </div>

      {item.skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.skills.map((skill) => (
            <Badge key={skill}>{skill}</Badge>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {answers.map((text, index) => (
          <p key={index} className="t-body whitespace-pre-wrap">
            {text}
          </p>
        ))}
      </div>

      {item.links.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {item.links.map((link) => (
            <li key={link}>
              <a href={link} className="t-link break-all text-base" target="_blank" rel="noreferrer">
                {link}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {item.status === "withdrawn" ? (
        <p className="t-meta border-t border-line pt-4">Withdrawn by the contributor.</p>
      ) : (
        <form
          className="grid gap-4 border-t border-line pt-5"
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
          {error ? <ErrorMessage title="That didn't save">{error}</ErrorMessage> : null}
          <Field label="Status" htmlFor={`status-${item.id}`}>
            <SelectInput id={`status-${item.id}`} value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)}>
              {REVIEW_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {APPLICATION_STATUS_LABEL[value]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Message" htmlFor={`note-${item.id}`} hint="Optional. The contributor sees this.">
            <TextArea id={`note-${item.id}`} value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </Field>
          <Button type="submit" disabled={pending} className="justify-self-start">
            {pending ? "Saving…" : "Save decision"}
          </Button>
        </form>
      )}
    </li>
  );
}
