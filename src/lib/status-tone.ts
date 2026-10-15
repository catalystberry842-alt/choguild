import type { ApplicationStatus, OpportunityStatus } from "@/lib/board/copy";
import type { WorkStatus } from "@/lib/work/copy";

/** Badge tones, named for what they mean. */
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

/** The one place statuses map to colours, so every page shows a status the same way. */
export function opportunityTone(status: OpportunityStatus | string): Tone {
  return status === "open" ? "success" : "neutral";
}

export function applicationTone(status: ApplicationStatus | string): Tone {
  switch (status) {
    case "accepted":
      return "success";
    case "rejected":
      return "danger";
    case "under_review":
    case "shortlisted":
      return "info";
    default:
      return "neutral";
  }
}

export function workTone(status: WorkStatus | string): Tone {
  switch (status) {
    case "accepted":
      return "success";
    case "rejected":
      return "danger";
    case "changes_requested":
      return "warning";
    case "submitted":
    case "under_review":
      return "info";
    default:
      return "neutral";
  }
}
