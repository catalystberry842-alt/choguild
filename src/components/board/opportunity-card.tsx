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
    <li>
      <Link
        to="/discover/$opportunityId"
        params={{ opportunityId: item.id }}
        className="card-pop surface group flex flex-col gap-5 p-5 sm:p-6"
      >
        <div className="flex min-w-0 gap-4">
          <ProjectMark name={project} logoUrl={item.projectLogoUrl} />
          <div className="min-w-0 flex-1">
            <h3 className="t-h3">{item.title}</h3>
            <p className="t-meta mt-1">{project}</p>
            <p className="t-body mt-2 line-clamp-2">{cardSummary(item.summary)}</p>
          </div>
          <span aria-hidden="true" className="hidden self-center text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block">
            →
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5">
            {item.isDemo ? <Badge tone="warning">Demo</Badge> : null}
            <Badge>{category}</Badge>
            <Badge tone={item.status === "open" ? "olive" : "neutral"}>
              {label(OPPORTUNITY_STATUS_LABEL, item.status as OpportunityStatus)}
            </Badge>
          </div>
          <p className="t-meta ml-auto">
            {label(COMPENSATION_LABEL, item.compensationType as CompensationType)}
            {item.deadline ? ` · Due ${formatDay(item.deadline)}` : ""}
          </p>
        </div>

        {item.myApplicationStatus ? (
          <p className="t-body -mt-1">
            You applied · {APPLICATION_STATUS_LABEL[item.myApplicationStatus as ApplicationStatus]}
          </p>
        ) : null}
      </Link>
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
