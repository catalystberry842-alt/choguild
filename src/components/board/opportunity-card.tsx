import { Link } from "@tanstack/react-router";
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

export function OpportunityCardView({ item }: { item: OpportunityCard }) {
  const project = projectLabel(item.projectName);
  const category = label(CATEGORY_LABEL, item.category as Category);

  return (
    <li className="card-pop @container rounded-3xl border border-line bg-elevated p-5 md:p-6">
      <div className="grid grid-cols-1 items-start gap-4 @2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,16rem)_auto] @2xl:items-center @2xl:gap-6">
        <div className="flex min-w-0 gap-4">
          <ProjectMark name={project} logoUrl={item.projectLogoUrl} />
          <div className="min-w-0">
            <h3 className="text-base leading-snug font-semibold text-ink">{item.title}</h3>
            <p className="mt-0.5 text-sm leading-5 text-body">{project}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-body">{cardSummary(item.summary)}</p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 @2xl:border-t-0 @2xl:pt-0 @2xl:grid-cols-1">
          <div className="col-span-2 flex flex-wrap gap-1 @2xl:col-span-1">
            {item.isDemo ? <Badge tone="warning">Demo</Badge> : null}
            <Badge>{category}</Badge>
            <Badge tone={item.status === "open" ? "olive" : "neutral"}>
              {label(OPPORTUNITY_STATUS_LABEL, item.status as OpportunityStatus)}
            </Badge>
          </div>
          <div>
            <p className="text-[11px] leading-4 text-muted">Compensation</p>
            <p className="text-xs leading-4 text-ink">{label(COMPENSATION_LABEL, item.compensationType as CompensationType)}</p>
          </div>
          <div>
            <p className="text-[11px] leading-4 text-muted">Deadline</p>
            <p className="text-xs leading-4 text-ink">{item.deadline ? formatDay(item.deadline) : "None"}</p>
          </div>
        </div>

        <Link
          to="/discover/$opportunityId"
          params={{ opportunityId: item.id }}
          className="group/link inline-flex w-fit items-center gap-1 text-sm font-semibold text-sand hover:text-sand-hover @2xl:justify-self-end"
        >
          View opportunity
          <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-0.5">→</span>
        </Link>
      </div>
      {item.myApplicationStatus ? (
        <p className="mt-3 text-sm text-body">
          Your application is {APPLICATION_STATUS_LABEL[item.myApplicationStatus as ApplicationStatus].toLowerCase()}.
        </p>
      ) : null}
    </li>
  );
}

export function ProjectMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const initial = name.replace(/^Example ·\s*/, "").slice(0, 1).toUpperCase();
  if (logoUrl) {
    return <img src={logoUrl} alt="" className="size-9 rounded-md border border-line object-cover" />;
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-ink ring-1 ring-line">
      {initial}
    </span>
  );
}
