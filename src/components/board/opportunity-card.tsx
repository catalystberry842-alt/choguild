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

export function OpportunityCardView({ item }: { item: OpportunityCard }) {
  const project = projectLabel(item.projectName);
  const category = label(CATEGORY_LABEL, item.category as Category);

  return (
    <Reveal as="li" y={14}>
      <Link
        to="/discover/$opportunityId"
        params={{ opportunityId: item.id }}
        className="card-pop surface spotlight group flex flex-col gap-5 p-5 sm:p-6"
      >
        <div className="flex min-w-0 gap-4">
          <ProjectMark name={project} logoUrl={item.projectLogoUrl} />
          <div className="min-w-0 flex-1">
            <h3 className="t-h3">{item.title}</h3>
            <p className="t-meta mt-1">{project}</p>
            <p className="t-body mt-2 line-clamp-2">{cardSummary(item.summary)}</p>
          </div>
          <span aria-hidden="true" className="hidden size-9 shrink-0 items-center justify-center self-center rounded-full border border-white/10 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-white/20 group-hover:bg-white/[0.05] group-hover:text-ink sm:flex">
            →
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
          <div className="flex flex-wrap gap-1.5">
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
    </Reveal>
  );
}

export function ProjectMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const initial = name.slice(0, 1).toUpperCase();
  if (logoUrl) {
    return <img src={logoUrl} alt="" className="size-10 shrink-0 rounded-xl border border-white/10 object-cover" />;
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-sm font-semibold text-ink">
      {initial}
    </span>
  );
}
