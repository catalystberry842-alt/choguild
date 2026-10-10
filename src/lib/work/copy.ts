export const WORK_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "changes_requested",
  "rejected",
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export const REVIEW_ACTIONS = ["under_review", "accepted", "changes_requested", "rejected"] as const;

export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

const CONTRIBUTOR_NEXT: Partial<Record<WorkStatus, WorkStatus[]>> = {
  draft: ["submitted"],
  changes_requested: ["submitted"],
};

const REVIEWER_NEXT: Partial<Record<WorkStatus, ReviewAction[]>> = {
  submitted: ["under_review", "accepted", "changes_requested", "rejected"],
  under_review: ["accepted", "changes_requested", "rejected"],
};

export function contributorCanSubmit(status: WorkStatus): boolean {
  return Boolean(CONTRIBUTOR_NEXT[status]?.includes("submitted"));
}

export function reviewerCan(status: WorkStatus, action: ReviewAction): boolean {
  return Boolean(REVIEWER_NEXT[status]?.includes(action));
}
