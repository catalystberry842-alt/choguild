export const CATEGORIES = [
  "content",
  "development",
  "design",
  "research",
  "community",
  "marketing",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const COMPENSATION_TYPES = ["paid", "token", "grant", "revenue", "unpaid"] as const;

export type CompensationType = (typeof COMPENSATION_TYPES)[number];

export const OPPORTUNITY_STATUSES = ["draft", "open", "closed", "filled"] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "submitted",
  "under_review",
  "shortlisted",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const REVIEW_STATUSES = ["submitted", "under_review", "shortlisted", "accepted", "rejected"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  content: "Content writing",
  development: "Development",
  design: "Design",
  research: "Research",
  community: "Community",
  marketing: "Marketing",
  other: "Other",
};

export const COMPENSATION_LABEL: Record<CompensationType, string> = {
  paid: "Paid",
  token: "Token-based",
  grant: "Grant-funded",
  revenue: "Revenue-sharing",
  unpaid: "Unpaid collaboration",
};

export const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  filled: "Filled",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const BOARD_SKILLS = [
  "Content writing",
  "Development",
  "Design",
  "Research",
  "Community",
  "Marketing",
] as const;

export const COMPENSATION_NOTE: Partial<Record<CompensationType, string>> = {
  token: "Token-based work is not guaranteed income.",
  revenue: "Revenue-sharing is not guaranteed income.",
};
