import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PosterMark } from "@/components/board/opportunity-card";
import { HoldersOnlyPill, RewardPill } from "@/components/chog/chog-bits";
import { usePassport } from "@/components/passport/passport-provider";
import { useQuestPing } from "@/components/chog/quest-panel";
import { Button } from "@/components/ui/button";
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
import { deadlineCountdown, plainCopy, projectLabel } from "@/lib/board/display";
import { sendApplication, updateBoardStatus, withdrawBoardApplication } from "@/lib/board/functions";
import type { OpportunityDetail } from "@/lib/board/types";
import type { BoardErrors } from "@/lib/board/validate";
import { cn } from "@/lib/cn";
import { formatDay, formatStamp } from "@/lib/passport/format";

export function OpportunityDetailView({ opportunity }: { opportunity: OpportunityDetail }) {
  const router = useRouter();
  const { profile, sessionAddress, chogId } = usePassport();
  useQuestPing("scout", opportunity.id, Boolean(chogId) && !opportunity.mine && opportunity.status === "open");
  const apply = useServerFn(sendApplication);
  const withdraw = useServerFn(withdrawBoardApplication);
  const setStatus = useServerFn(updateBoardStatus);
  const [intro, setIntro] = useState(profile?.biography ?? "");
  const [suitability, setSuitability] = useState("");
  const [experience, setExperience] = useState(profile?.skills.join(", ") ?? "");
  const [links, setLinks] = useState([profile?.githubUrl, profile?.xUrl].filter(Boolean).join("\n"));
  const [extra, setExtra] = useState("");
  const [errors, setErrors] = useState<BoardErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const note = COMPENSATION_NOTE[opportunity.compensationType as CompensationType];
  const project = projectLabel(opportunity.projectName);
  const pay = COMPENSATION_LABEL[opportunity.compensationType as CompensationType] ?? opportunity.compensationType;
  const payDetail = plainCopy(opportunity.compensationDetails);
  const compensationLine = payDetail
    ? `${pay}. ${payDetail.replace(/\.$/, "")}${note && !/guaranteed/i.test(payDetail) ? `. ${note}` : "."}`
    : note
      ? `${pay}. ${note}`
      : pay;
  const unavailable = !opportunity.accepting;
  const countdown = deadlineCountdown(opportunity.deadline);
  const isPastDue = opportunity.status === "open" && !!opportunity.deadline && new Date(opportunity.deadline).getTime() <= Date.now();
  const statusLabel = isPastDue ? "Past due" : (OPPORTUNITY_STATUS_LABEL[opportunity.status as OpportunityStatus] ?? opportunity.status);
  const categoryLabel = CATEGORY_LABEL[opportunity.category as Category] ?? opportunity.category;
  const posterName = opportunity.poster.displayName || opportunity.poster.username || project;
  const posterHandle = opportunity.poster.username;
  const positionsLabel =
    opportunity.positions == null
      ? "—"
      : `${opportunity.acceptedCount}/${opportunity.positions}`;
  const applied =
    Boolean(done) ||
    Boolean(opportunity.myApplicationStatus && opportunity.myApplicationStatus !== "withdrawn");

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

  async function change(status: "open" | "closed" | "filled") {
    setPending(true);
    const result = await setStatus({ data: { id: opportunity.id, status } });
    setPending(false);
    setMessage(result.ok ? null : result.error);
    if (result.ok) await router.invalidate();
  }

  const cta = stickyCta({
    opportunity,
    sessionAddress: sessionAddress ?? null,
    hasProfile: Boolean(profile),
    applied,
    pending,
    done,
  });

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6 pb-28 sm:gap-8 sm:pb-10 lg:max-w-6xl 2xl:max-w-7xl lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-x-8">
      <section className="stage rise relative px-5 pt-10 pb-6 sm:px-10 sm:pt-12 lg:col-span-2">
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label",
                opportunity.status === "open" && !isPastDue ? "bg-success/10 text-success" : "bg-line/50 text-muted",
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", opportunity.status === "open" && !isPastDue ? "bg-success" : "bg-muted")}
                aria-hidden="true"
              />
              {statusLabel}
            </span>
            <span className="glass-chip rounded-full px-2.5 py-1 text-label text-ink">{categoryLabel}</span>
            {opportunity.rewardChog ? <RewardPill amount={opportunity.rewardChog} /> : null}
            {opportunity.holdersOnly ? <HoldersOnlyPill /> : null}
          </div>

          <div className="flex items-start gap-4">
            {posterHandle ? (
              <Link to="/passport/$username" params={{ username: posterHandle }} className="shrink-0">
                <PosterMark
                  name={posterName}
                  logoUrl={opportunity.projectLogoUrl}
                  avatarUrl={opportunity.poster.avatarUrl}
                  size="lg"
                />
              </Link>
            ) : (
              <PosterMark
                name={posterName}
                logoUrl={opportunity.projectLogoUrl}
                avatarUrl={opportunity.poster.avatarUrl}
                size="lg"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="t-title tracking-tight">{opportunity.title}</h1>
              <p className="t-meta mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                {posterHandle ? (
                  <Link to="/passport/$username" params={{ username: posterHandle }} className="t-link">
                    @{posterHandle}
                  </Link>
                ) : (
                  <span>{project}</span>
                )}
                <span aria-hidden="true">·</span>
                <span>{project}</span>
                {opportunity.ownerWallet.startsWith("chog:") ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <Link to="/chog/$chogId" params={{ chogId: opportunity.ownerWallet.slice(5) }} className="t-link">
                      Posted by Chog #{opportunity.ownerWallet.slice(5)}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {opportunity.summary ? (
            <p className="t-lead max-w-2xl text-pretty">{plainCopy(opportunity.summary)}</p>
          ) : null}

          <dl className="mt-4 grid grid-cols-2 gap-y-6 border-t border-line pt-6 sm:grid-cols-4">
            <Stat label="Compensation" value={pay} />
            <Stat
              label="Due date"
              value={countdown ?? (opportunity.deadline ? formatDay(opportunity.deadline) : "No deadline")}
              hint={opportunity.deadline && countdown ? formatDay(opportunity.deadline) : undefined}
            />
            <Stat label="Positions" value={positionsLabel} hint={opportunity.positions == null ? undefined : "accepted / total"} />
            <Stat
              label="Applicants"
              value={String(opportunity.applicantCount)}
            />
          </dl>
          {payDetail || note ? (
            <p className="t-meta text-pretty">{compensationLine}</p>
          ) : null}
        </div>
      </section>

      <GlassBlock title="The work" body={plainCopy(opportunity.description)} />
      {plainCopy(opportunity.scope) ? <GlassBlock title="Requirements" body={plainCopy(opportunity.scope)} /> : null}

      <section className="surface p-6 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-6 lg:row-start-2">
        <h2 className="t-kicker">Required skills</h2>
        {opportunity.requiredSkills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {opportunity.requiredSkills.map((skill) => (
              <span key={skill} className="glass-chip rounded-full px-3 py-1 text-small text-ink">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="t-body mt-3 text-muted">None listed.</p>
        )}
        {opportunity.preferredSkills.length > 0 ? (
          <>
            <h3 className="t-kicker mt-6">Preferred</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {opportunity.preferredSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-line px-3 py-1 text-small text-body">
                  {skill}
                </span>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {plainCopy(opportunity.deliverables) ? (
        <GlassBlock title="Deliverables" body={plainCopy(opportunity.deliverables)} />
      ) : null}
      {plainCopy(opportunity.instructions) ? (
        <GlassBlock title="How to apply" body={plainCopy(opportunity.instructions)} />
      ) : null}

      <section id="apply" className="surface scroll-mt-28 p-6 sm:p-8">
        <h2 className="t-h2">
          Apply <em>here</em>
        </h2>
        {opportunity.myApplicationStatus ? (
          <p className="t-body mt-2">
            Your application: {APPLICATION_STATUS_LABEL[opportunity.myApplicationStatus as ApplicationStatus]}.
          </p>
        ) : null}
        {done ? <p className="t-body mt-3 text-ink">Application sent. You'll see the decision under Applications.</p> : null}

        {opportunity.mine ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to="/opportunities/$opportunityId/edit" params={{ opportunityId: opportunity.id }}>
                Edit
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/opportunities/$opportunityId/applications" params={{ opportunityId: opportunity.id }}>
                Review applications
              </Link>
            </Button>
            {opportunity.status === "open" ? (
              <Button disabled={pending} onClick={() => void change("closed")}>
                Close applications
              </Button>
            ) : null}
            {opportunity.status !== "filled" && opportunity.status !== "draft" ? (
              <Button variant="secondary" disabled={pending} onClick={() => void change("filled")}>
                Mark filled
              </Button>
            ) : null}
            {opportunity.status !== "open" && opportunity.status !== "draft" ? (
              <Button variant="ghost" disabled={pending} onClick={() => void change("open")}>
                Reopen
              </Button>
            ) : null}
          </div>
        ) : null}

        {unavailable && !opportunity.mine ? (
          <p className="t-body mt-3">
            {opportunity.status === "filled"
              ? "This opportunity is filled."
              : opportunity.status === "closed" ||
                  (opportunity.deadline && new Date(opportunity.deadline).getTime() <= Date.now())
                ? "Applications are closed."
                : "Applications are not open."}
          </p>
        ) : null}

        {!opportunity.mine && opportunity.accepting && !sessionAddress ? (
          <p className="t-body mt-3">
            Sign in on your{" "}
            <Link to="/passport" className="t-link">
              Passport
            </Link>{" "}
            to apply.
          </p>
        ) : null}
        {!opportunity.mine && opportunity.accepting && sessionAddress && !chogId ? (
          <p className="t-body mt-3">
            Only a Chog can take a listing. Pick a Chog you own on your{" "}
            <Link to="/passport" className="t-link">
              Passport
            </Link>
            . Without one you can view, not apply.
          </p>
        ) : null}
        {!opportunity.mine && opportunity.accepting && sessionAddress && chogId && !profile ? (
          <p className="t-body mt-3">
            Save Chog #{chogId}'s{" "}
            <Link to="/passport" className="t-link">
              Passport
            </Link>{" "}
            first, then apply.
          </p>
        ) : null}

        {!opportunity.mine && opportunity.accepting && profile && !opportunity.myApplicationStatus && !done ? (
          <form
            className="mt-5 grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void onApply();
            }}
          >
            {message ? <ErrorMessage title="Application was not sent">{message}</ErrorMessage> : null}
            <p className="t-meta">
              Applying as {profile.displayName} · @{profile.username}
            </p>
            {opportunity.holdersOnly ? (
              <p className="t-meta">This listing is for Chog Genesis holders. Your wallet is checked on Monad when you send.</p>
            ) : null}
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
            <Button type="submit" disabled={pending} className="justify-self-start hidden sm:inline-flex">
              {pending ? "Sending…" : "Send application"}
            </Button>
          </form>
        ) : null}

        {opportunity.myApplicationStatus &&
        ["submitted", "under_review", "shortlisted"].includes(opportunity.myApplicationStatus) ? (
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
        {message && !done ? <p className="mt-3 text-base text-danger">{message}</p> : null}

        <p className="t-meta mt-6">
          Posted {formatStamp(opportunity.createdAt)}
          {opportunity.updatedAt !== opportunity.createdAt ? ` · Updated ${formatStamp(opportunity.updatedAt)}` : ""}
        </p>
      </section>

      {/* Mobile sticky primary CTA — one glass bar, no nested blur. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[rgb(10_10_10/0.95)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        {cta.kind === "link" ? (
          <Button asChild>
            <Link to={cta.to}>{cta.label}</Link>
          </Button>
        ) : cta.kind === "anchor" ? (
          <Button onClick={() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" })}>
            {cta.label}
          </Button>
        ) : cta.kind === "submit" ? (
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>("#apply form");
              form?.requestSubmit();
            }}
          >
            {pending ? "Sending…" : cta.label}
          </Button>
        ) : (
          <Button disabled>
            {cta.label}
          </Button>
        )}
      </div>
    </article>
  );
}

function GlassBlock({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <section className="grid gap-3 border-t border-line pt-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8">
      <h2 className="t-kicker sm:pt-1">{title}</h2>
      <p className="t-lead whitespace-pre-wrap text-pretty text-ink">{body}</p>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-l border-line pl-4 first:border-l-0 first:pl-0 max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(3)]:pl-0">
      <dt className="t-kicker">{label}</dt>
      <dd className="mt-2 text-lead font-medium tracking-[-0.02em] text-ink">{value}</dd>
      {hint ? <p className="mt-0.5 text-label text-muted">{hint}</p> : null}
    </div>
  );
}

function stickyCta({
  opportunity,
  sessionAddress,
  hasProfile,
  applied,
  pending,
  done,
}: {
  opportunity: OpportunityDetail;
  sessionAddress: string | null;
  hasProfile: boolean;
  applied: boolean;
  pending: boolean;
  done: string | null;
}):
  | { kind: "link"; to: "/passport"; label: string }
  | { kind: "anchor"; label: string }
  | { kind: "submit"; label: string }
  | { kind: "disabled"; label: string } {
  if (opportunity.mine) return { kind: "anchor", label: "Manage listing" };
  if (applied || done) {
    const status = opportunity.myApplicationStatus
      ? APPLICATION_STATUS_LABEL[opportunity.myApplicationStatus as ApplicationStatus]
      : "Applied";
    return { kind: "disabled", label: status };
  }
  if (!opportunity.accepting) {
    return {
      kind: "disabled",
      label: opportunity.status === "filled" ? "Filled" : "Applications closed",
    };
  }
  if (!sessionAddress) return { kind: "link", to: "/passport", label: "Connect wallet" };
  if (!hasProfile) return { kind: "link", to: "/passport", label: "Act as a Chog to apply" };
  return { kind: "submit", label: pending ? "Sending…" : "Apply" };
}
