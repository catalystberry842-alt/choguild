export type OpportunityStatus = "open" | "closing" | "closed";

export type DemoOpportunity = {
  id: string;
  title: string;
  project: string;
  skills: string[];
  reward: string | null;
  deadline: string | null;
  status: OpportunityStatus;
};

export const DEMO_DISCLAIMER =
  "Demonstration records only. These are not live Monad projects, and applications are not open.";

export const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  {
    id: "demo-onboarding-note",
    title: "Draft a contributor onboarding note",
    project: "Sample project · North Annex",
    skills: ["Writing", "Research"],
    reward: "Sample reward · noted, not payable",
    deadline: "Sample date · 18 Nov 2026",
    status: "open",
  },
  {
    id: "demo-receipt-layout",
    title: "Sketch a contribution receipt layout",
    project: "Sample project · Field Notes",
    skills: ["Design"],
    reward: "Sample reward · noted, not payable",
    deadline: "Sample date · 2 Dec 2026",
    status: "closing",
  },
  {
    id: "demo-checklist",
    title: "Write a local testing checklist",
    project: "Sample project · Lantern Desk",
    skills: ["Engineering", "Writing"],
    reward: null,
    deadline: "Sample date · 9 Dec 2026",
    status: "open",
  },
  {
    id: "demo-archive",
    title: "Index an old discussion thread",
    project: "Sample project · Harbor Index",
    skills: ["Community", "Research"],
    reward: null,
    deadline: null,
    status: "closed",
  },
];

export const DEMO_SKILLS = ["Writing", "Research", "Design", "Engineering", "Community"] as const;

export type DemoSkill = (typeof DEMO_SKILLS)[number];

export const STATUS_LABEL: Record<OpportunityStatus, string> = {
  open: "Open",
  closing: "Closing soon",
  closed: "Closed",
};

export function filterOpportunities(
  items: DemoOpportunity[],
  query: string,
  skills: string[],
  status: OpportunityStatus | "all",
) {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (skills.length > 0 && !skills.some((skill) => item.skills.includes(skill))) return false;
    if (!needle) return true;
    const haystack = [item.title, item.project, ...item.skills].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}
