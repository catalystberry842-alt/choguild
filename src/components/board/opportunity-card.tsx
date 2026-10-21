import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  APPLICATION_STATUS_LABEL,
  CATEGORY_LABEL,
  COMPENSATION_LABEL,
  OPPORTUNITY_STATUS_LABEL,
  type ApplicationStatus,
  type Category,
  type CompensationType,
  type OpportunityStatus,
} from "@/lib/board/copy";
import { cardSummary, deadlineCountdown, projectLabel, usableImageUrl } from "@/lib/board/display";
import type { OpportunityCard } from "@/lib/board/types";
import { HoldersOnlyPill } from "@/components/chog/chog-bits";
import { cn } from "@/lib/cn";
import { formatDay } from "@/lib/passport/format";

function label<T extends string>(map: Record<T, string>, value: string): string {
  return map[value as T] ?? value;
}

/** One listing as a ruled row: poster, title, skills, terms, due date and status. Stacks on mobile. */
export function OpportunityCardView({ item }: { item: OpportunityCard; index?: number; animate?: boolean }) {
  const project = projectLabel(item.projectName);
  const due = deadlineCountdown(item.deadline);
  const pastDue = due === "Past due";
  const open = item.status === "open" && !pastDue;
  const posterName = item.poster.displayName || item.poster.username || project;
  const statusText = item.status === "open" && pastDue ? "Past due" : label(OPPORTUNITY_STATUS_LABEL, item.status as OpportunityStatus);

  return (
    <li>
      <Link
        to="/discover/$opportunityId"
        params={{ opportunityId: item.id }}
        className="group grid gap-3 px-5 py-5 transition-colors hover:bg-line/50 sm:px-6 md:grid-cols-[minmax(0,1fr)_10rem_8rem_6.5rem_1rem] md:items-center md:gap-6"
      >
        <span className="flex min-w-0 items-start gap-3.5">
          <PosterMark name={posterName} logoUrl={item.projectLogoUrl} avatarUrl={item.poster.avatarUrl} />
          <span className="min-w-0">
            <span className="block truncate text-base font-medium text-ink">{item.title}</span>
            <span className="mt-0.5 block truncate text-small text-muted">
              {project}
              {item.poster.username ? ` · @${item.poster.username}` : ""} · {label(CATEGORY_LABEL, item.category as Category)}
            </span>
            {item.requiredSkills.length > 0 || item.holdersOnly ? (
              <span className="mt-2.5 flex flex-wrap gap-1.5">
                {item.holdersOnly ? <HoldersOnlyPill /> : null}
                {item.requiredSkills.slice(0, 3).map((skill) => (
                  <span key={skill} className="rounded-full border border-line-strong px-2 py-0.5 text-label text-body">{skill}</span>
                ))}
              </span>
            ) : null}
            {item.myApplicationStatus ? (
              <span className="mt-2 block text-label text-ink">You applied · {APPLICATION_STATUS_LABEL[item.myApplicationStatus as ApplicationStatus]}</span>
            ) : null}
          </span>
        </span>
        <span className="pl-[3.125rem] text-small text-ink md:pl-0">
          <span className="t-kicker mr-2 md:hidden">Terms</span>
          {label(COMPENSATION_LABEL, item.compensationType as CompensationType)}
        </span>
        <span className="pl-[3.125rem] text-small tabular-nums text-body md:pl-0">
          <span className="t-kicker mr-2 md:hidden">Due</span>
          {due ?? (item.deadline ? formatDay(item.deadline) : "No deadline")}
        </span>
        <span className="pl-[3.125rem] md:pl-0">
          <span className={cn("inline-flex items-center gap-1.5 text-small", open ? "text-success" : "text-muted")}>
            <span className={cn("size-1.5 rounded-full", open ? "bg-success" : "bg-muted")} aria-hidden="true" />
            {statusText}
          </span>
        </span>
        <span aria-hidden="true" className="arrow-slide hidden text-muted group-hover:text-ink md:block">→</span>
      </Link>
    </li>
  );
}

/**
 * Avatar for a listing: project logo if it is a real image, else poster passport
 * avatar / Chog, else a letter initial. Broken images fall back to the initial.
 */
export function PosterMark({
  name,
  logoUrl,
  avatarUrl,
  size = "md",
  className = "",
}: {
  name: string;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const src = usableImageUrl(logoUrl) ?? usableImageUrl(avatarUrl);
  const [failed, setFailed] = useState(false);
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();
  const box = size === "lg" ? "size-14 text-lead" : "size-9 text-small";

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className={cn(box, "shrink-0 rounded-full border border-line object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-secondary font-semibold text-ink",
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

/** @deprecated Prefer PosterMark; kept for any remaining imports. */
export function ProjectMark({ name, logoUrl, className = "" }: { name: string; logoUrl: string | null; className?: string }) {
  return <PosterMark name={name} logoUrl={logoUrl} className={className} />;
}

