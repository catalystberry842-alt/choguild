import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/fx/reveal";
import { Badge } from "@/components/ui/badge";
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
import { cardSummary, projectLabel } from "@/lib/board/display";
import type { OpportunityCard } from "@/lib/board/types";
import { formatDay } from "@/lib/passport/format";

function label<T extends string>(map: Record<T, string>, value: string): string {
  return map[value as T] ?? value;
}

/** One listing as a ruled row: index, project, title and summary, terms, arrow. */
export function OpportunityCardView({ item, index }: { item: OpportunityCard; index?: number }) {
  const project = projectLabel(item.projectName);
  const category = label(CATEGORY_LABEL, item.category as Category);

  return (
    <Reveal as="li" y={10} className="border-b border-line">
      <Link
        to="/discover/$opportunityId"
        params={{ opportunityId: item.id }}
        className="row-link group grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 py-6 md:grid-cols-[3rem_minmax(0,1fr)_14rem_2rem] md:items-start"
      >
        <span className="hidden pt-1 font-mono text-[11px] text-faint md:block">
          {index !== undefined ? String(index + 1).padStart(2, "0") : "—"}
        </span>
        <ProjectMark name={project} logoUrl={item.projectLogoUrl} className="md:hidden" />
        <div className="min-w-0">
          <p className="t-label">{project} · {category}</p>
          <h3 className="t-display mt-2 text-[1.5rem] leading-[1.15] transition-colors group-hover:text-signal">{item.title}</h3>
          <p className="t-body mt-2 line-clamp-2 max-w-2xl">{cardSummary(item.summary)}</p>
          {item.myApplicationStatus ? (
            <p className="mt-3 font-mono text-[11px] text-signal">
              You applied · {APPLICATION_STATUS_LABEL[item.myApplicationStatus as ApplicationStatus]}
            </p>
          ) : null}
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:flex-col md:items-start md:gap-1.5 md:pt-1">
          <p className="text-[13px] text-ink">{label(COMPENSATION_LABEL, item.compensationType as CompensationType)}</p>
          <p className="t-meta">{item.deadline ? `Due ${formatDay(item.deadline)}` : "No deadline"}</p>
          <Badge tone={item.status === "open" ? "olive" : "neutral"} className="md:mt-1">
            {label(OPPORTUNITY_STATUS_LABEL, item.status as OpportunityStatus)}
          </Badge>
        </div>
        <span aria-hidden="true" className="arrow-slide hidden pt-1 text-right text-muted group-hover:text-signal md:block">→</span>
      </Link>
    </Reveal>
  );
}

export function ProjectMark({ name, logoUrl, className = "" }: { name: string; logoUrl: string | null; className?: string }) {
  const initial = name.slice(0, 1).toUpperCase();
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={"size-9 shrink-0 rounded-md border border-line object-cover " + className} />;
  }
  return (
    <span className={"t-display flex size-9 shrink-0 items-center justify-center rounded-md border border-line-strong text-[1.1rem] text-ink " + className}>
      {initial}
    </span>
  );
}
