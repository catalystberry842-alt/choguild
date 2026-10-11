import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ProjectMark } from "@/components/board/opportunity-card";
import { usePassport } from "@/components/passport/passport-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, TextArea } from "@/components/ui/input";
import {
  APPLICATION_STATUS_LABEL,
  CATEGORY_LABEL,
  COMPENSATION_LABEL,
  COMPENSATION_NOTE,
  OPPORTUNITY_STATUS_LABEL,
  type ApplicationStatus,
  type Category,
  type CompensationType,
  type OpportunityStatus,
} from "@/lib/board/copy";
import { listingSummary, plainCopy, projectLabel } from "@/lib/board/display";
import { getBoardOpportunity, sendApplication, updateBoardStatus, withdrawBoardApplication } from "@/lib/board/functions";
import type { BoardErrors } from "@/lib/board/validate";
import { formatStamp } from "@/lib/passport/format";

export const Route = createFileRoute("/discover/$opportunityId")({
  loader: async ({ params }) => {
    const opportunity = await getBoardOpportunity({ data: params.opportunityId });
    if (!opportunity) throw notFound();
    return opportunity;
  },
  staticData: { title: "Opportunity", crumb: "Discover" },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Choguild` : "Opportunity · Choguild" }],
  }),
  component: OpportunityPage,
  notFoundComponent: () => (
    <EmptyState
      title="This opportunity is not on the board"
      body="It may be a draft, or the address is wrong."
      action={<Link to="/discover" search={{ q: "", category: "all", skills: [], compensation: "all", status: "open", sort: "newest", page: 1 }} className="text-sm font-medium text-sand">Back to Discover</Link>}
    />
  ),
});

function OpportunityPage() {
  const opportunity = Route.useLoaderData();
  const router = useRouter();
  const { profile, sessionAddress } = usePassport();
  const apply = useServerFn(sendApplication);
  const withdraw = useServerFn(withdrawBoardApplication);
  const setStatus = useServerFn(updateBoardStatus);
  const [intro, setIntro] = useState(profile?.biography ?? "");
  const [suitability, setSuitability] = useState("");
  const [experience, setExperience] = useState(profile?.skills.join(", ") ?? "");
  const [links, setLinks] = useState(
    [profile?.portfolioUrl, profile?.githubUrl, profile?.xUrl].filter(Boolean).join("\n"),
  );
  const [extra, setExtra] = useState("");
  const [errors, setErrors] = useState<BoardErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const note = COMPENSATION_NOTE[opportunity.compensationType as CompensationType];
  const project = projectLabel(opportunity.projectName);
  const pay = COMPENSATION_LABEL[opportunity.compensationType as CompensationType] ?? opportunity.compensationType;
  const payDetail = plainCopy(opportunity.compensationDetails);
  const time = plainCopy(opportunity.timeCommitment);
  const timeLabel = time ? time.charAt(0).toUpperCase() + time.slice(1) : "Time not specified";
  const compensationLine = payDetail
    ? `${pay}. ${payDetail.replace(/\.$/, "")}${note && !/guaranteed/i.test(payDetail) ? `. ${note}` : "."}`
    : note
      ? `${pay}. ${note}`
      : pay;
  const unavailable = !opportunity.accepting;

  async function onApply() {
    setPending(true);
    setMessage(null);
    const result = await apply({
      data: {
        opportunityId: opportunity.id,
        application: {
          introduction: intro,
          suitability,
          experience,
          links: links.split(/\n+/),
          extraAnswer: extra,
        },
      },
    });
    setPending(false);
    if (!result.ok) {
      setErrors("fieldErrors" in result ? result.fieldErrors ?? {} : {});
      setMessage(result.error);
      return;
    }
    setDone(result.applicationId);
    await router.invalidate();
  }

  return (
    <article className="mx-auto max-w-3xl">
      <header className="flex items-start gap-4">
        <ProjectMark name={project} logoUrl={opportunity.projectLogoUrl} />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {opportunity.isDemo ? <Badge tone="warning">Demo</Badge> : null}
            <Badge>{OPPORTUNITY_STATUS_LABEL[opportunity.status as OpportunityStatus] ?? opportunity.status}</Badge>
          </div>
          <h1 className="mt-3 text-[2.5rem] leading-[1.05] font-bold tracking-tight text-ink">{opportunity.title}</h1>
          <p className="mt-2 text-sm text-body">
            {project} · {CATEGORY_LABEL[opportunity.category as Category] ?? opportunity.category}
          </p>
        </div>
      </header>

      <p className="mt-8 text-base leading-7 text-body">{listingSummary(opportunity.summary, opportunity.isDemo)}</p>

      <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-elevated px-6 py-5">
          <dt className="text-muted">Compensation</dt>
          <dd className="mt-2 leading-6 text-ink">{compensationLine || "Not specified"}</dd>
        </div>
        <div className="rounded-3xl border border-line bg-elevated px-6 py-5">
          <dt className="text-muted">Timing</dt>
          <dd className="mt-2 leading-6 text-ink">
            {timeLabel}
            {" · "}
            {opportunity.deadline ? `Due ${formatStamp(opportunity.deadline)}` : "No deadline"}
            {opportunity.positions ? ` · ${opportunity.positions} ${opportunity.positions === 1 ? "position" : "positions"}` : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-14 flex flex-col divide-y divide-line border-y border-line">
        <Block title="The work" body={plainCopy(opportunity.description)} />
        <Block title="Scope" body={plainCopy(opportunity.scope)} />
        <Block title="Deliverables" body={plainCopy(opportunity.deliverables)} />
        <section className="py-9">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Skills</h2>
          <p className="mt-3 text-[15px] leading-7 text-body">
            Required: {opportunity.requiredSkills.join(", ") || "None listed"}.
            {opportunity.preferredSkills.length > 0 ? ` Preferred: ${opportunity.preferredSkills.join(", ")}.` : " No preferred skills listed."}
          </p>
        </section>
        <Block title="How to apply" body={plainCopy(opportunity.instructions)} />
      </div>

      <section className="mt-14 rounded-3xl border border-line bg-elevated p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Application</h2>
        {opportunity.myApplicationStatus ? (
          <p className="mt-2 text-sm text-body">
            Status: {APPLICATION_STATUS_LABEL[opportunity.myApplicationStatus as ApplicationStatus]}. Submitting does not mean you were accepted.
          </p>
        ) : null}
        {done ? <p className="mt-3 text-sm text-sand">Application sent and marked as submitted, not yet accepted.</p> : null}
        {opportunity.mine && !opportunity.isDemo ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link to="/opportunities/$opportunityId/edit" params={{ opportunityId: opportunity.id }}>Edit</Link></Button>
            <Button asChild variant="secondary"><Link to="/opportunities/$opportunityId/applications" params={{ opportunityId: opportunity.id }}>Review applications</Link></Button>
            {opportunity.status === "open" ? <Button disabled={pending} onClick={() => void change("closed")}>Close applications</Button> : null}
            {opportunity.status !== "filled" && opportunity.status !== "draft" ? <Button variant="secondary" disabled={pending} onClick={() => void change("filled")}>Mark filled</Button> : null}
            {opportunity.status !== "open" && opportunity.status !== "draft" ? <Button variant="ghost" disabled={pending} onClick={() => void change("open")}>Reopen</Button> : null}
          </div>
        ) : null}
        {unavailable && !opportunity.mine ? (
          <p className="mt-3 text-sm text-body">
            {opportunity.isDemo
              ? "This is a demo opportunity, so applications are not accepted."
              : opportunity.status === "filled"
                ? "This opportunity is filled."
                : opportunity.status === "closed" || (opportunity.deadline && new Date(opportunity.deadline).getTime() <= Date.now())
                  ? "Applications are closed."
                  : "Applications are not open."}
          </p>
        ) : null}
        {!opportunity.mine && !opportunity.isDemo && opportunity.accepting && !sessionAddress ? (
          <p className="mt-3 text-sm text-body">Sign in on the Passport page before applying, since a connected wallet alone is not enough.</p>
        ) : null}
        {!opportunity.mine && !opportunity.isDemo && opportunity.accepting && sessionAddress && !profile ? (
          <p className="mt-3 text-sm text-body">Save your Chog Passport before applying, because an address alone is not an application.</p>
        ) : null}
        {!opportunity.mine && opportunity.accepting && profile && !opportunity.myApplicationStatus && !done ? (
          <form className="mt-4 grid gap-4" onSubmit={(event) => { event.preventDefault(); void onApply(); }}>
            {message ? <ErrorMessage title="Application was not sent">{message}</ErrorMessage> : null}
            <p className="text-sm text-body">Applying as {profile.displayName} (@{profile.username}). Review the prefilled lines before you send them.</p>
            <Field label="Introduction" htmlFor="app-intro" error={errors.introduction}>
              <TextArea id="app-intro" value={intro} onChange={(event) => setIntro(event.target.value)} required />
            </Field>
            <Field label="Why you are suitable" htmlFor="app-why" error={errors.suitability}>
              <TextArea id="app-why" value={suitability} onChange={(event) => setSuitability(event.target.value)} required />
            </Field>
            <Field label="Relevant experience" htmlFor="app-exp" hint="Optional." error={errors.experience}>
              <TextArea id="app-exp" value={experience} onChange={(event) => setExperience(event.target.value)} />
            </Field>
            <Field label="Work samples" htmlFor="app-links" hint="One https URL per line. Optional." error={errors.links}>
              <TextArea id="app-links" value={links} onChange={(event) => setLinks(event.target.value)} />
            </Field>
            {opportunity.question ? (
              <Field label={plainCopy(opportunity.question)} htmlFor="app-extra" error={errors.extraAnswer}>
                <TextArea id="app-extra" value={extra} onChange={(event) => setExtra(event.target.value)} />
              </Field>
            ) : null}
            <Button type="submit" disabled={pending}>{pending ? "Sending" : "Submit application"}</Button>
          </form>
        ) : null}
        {opportunity.myApplicationStatus && ["submitted", "under_review", "shortlisted"].includes(opportunity.myApplicationStatus) ? (
          <div className="mt-4">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setPending(true);
                void withdraw({ data: opportunity.myApplicationId ?? "" }).then(async (result) => {
                  setPending(false);
                  setMessage(result.ok ? null : result.error);
                  if (result.ok) await router.invalidate();
                });
              }}
            >
              Withdraw application
            </Button>
          </div>
        ) : null}
        {message && !done ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
      </section>
    </article>
  );

  async function change(status: "open" | "closed" | "filled") {
    setPending(true);
    const result = await setStatus({ data: { id: opportunity.id, status } });
    setPending(false);
    setMessage(result.ok ? null : result.error);
    if (result.ok) await router.invalidate();
  }
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <section className="py-9">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-body">{body}</p>
    </section>
  );
}
