import { Badge } from "@/components/ui/badge";
import {
  STATUS_LABEL,
  type DemoOpportunity,
  type OpportunityStatus,
} from "@/lib/demo-opportunities";

const statusTone: Record<OpportunityStatus, "olive" | "warning" | "neutral"> = {
  open: "olive",
  closing: "warning",
  closed: "neutral",
};

export function OpportunityList({ items }: { items: DemoOpportunity[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elevated">
      {items.map((item) => (
        <li key={item.id} className="px-4 py-5 md:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="sand">Demonstration</Badge>
                <Badge tone={statusTone[item.status]}>{STATUS_LABEL[item.status]}</Badge>
              </div>
              <h3 className="mt-2 text-base font-medium text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-body">{item.project}</p>
            </div>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Required skills</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {item.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Reward</dt>
              <dd className="mt-1 text-sm text-ink">{item.reward ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Deadline</dt>
              <dd className="mt-1 text-sm text-ink">{item.deadline ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Application status</dt>
              <dd className="mt-2">
                <Badge>Not available</Badge>
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
