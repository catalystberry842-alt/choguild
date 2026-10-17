import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Reveal } from "@/components/fx/reveal";
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

/** A rich listing card: project, status, title, summary, skills, and terms in a footer strip. */
export function OpportunityCardView({ item, animate = true }: { item: OpportunityCard; index?: number; animate?: boolean }) {
  const project = projectLabel(item.projectName);
  const open = item.status === "open";
  const posterName = item.poster.displayName || item.poster.username || project;
  const due = deadlineCountdown(item.deadline);

  return (
    <Reveal as="li" y={14} className="h-full" animate={animate}>
      <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }} className="bento group flex h-full flex-col">
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <PosterMark
                name={posterName}
                logoUrl={item.projectLogoUrl}
                avatarUrl={item.poster.avatarUrl}
              />
              <span className="min-w-0">
                <span className="block truncate text-small text-ink">{project}</span>
                <span className="block truncate text-label text-muted">
                  {item.poster.username ? `@${item.poster.username}` : label(CATEGORY_LABEL, item.category as Category)}
                </span>
              </span>
            </span>
            <span className={"inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-label " + (open ? "bg-success/10 text-success" : "bg-white/[0.05] text-muted")}>
              <span className={"size-1.5 rounded-full " + (open ? "bg-success" : "bg-muted")} aria-hidden="true" />
              {label(OPPORTUNITY_STATUS_LABEL, item.status as OpportunityStatus)}
            </span>
          </div>
          {item.holdersOnly ? <HoldersOnlyPill className="mt-4" /> : null}
          <h3 className="t-h3 mt-6 text-ink transition-colors group-hover:text-signal">{item.title}</h3>
          <p className="t-body mt-3 line-clamp-2">{cardSummary(item.summary)}</p>
          {item.requiredSkills.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {item.requiredSkills.slice(0, 4).map((skill) => (
                <li key={skill} className="glass-chip rounded-full px-2.5 py-0.5 text-label text-ink">{skill}</li>
              ))}
            </ul>
          ) : null}
          {item.myApplicationStatus ? (
            <p className="mt-4 text-label text-signal">You applied · {APPLICATION_STATUS_LABEL[item.myApplicationStatus as ApplicationStatus]}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line bg-black/20 px-6 py-3.5 text-small">
          <span className="text-ink">{label(COMPENSATION_LABEL, item.compensationType as CompensationType)}</span>
          <span className="flex items-center gap-3 text-muted">
            {due ?? (item.deadline ? `Due ${formatDay(item.deadline)}` : "No deadline")}
            <span aria-hidden="true" className="arrow-slide flex size-7 items-center justify-center rounded-full bg-white/[0.06] text-ink group-hover:bg-signal-solid group-hover:text-on-accent">→</span>
          </span>
        </div>
      </Link>
    </Reveal>
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

