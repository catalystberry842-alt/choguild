const DEMO_SUMMARIES: Record<string, string> = {
  "write a short contributor-facing note":
    "This example asks for a short note about how a contributor passport is used. It is demo content, not a live project.",
  "help shape a public contributor page":
    "This example opportunity focuses on improving a public contributor page. It is demo content, not a live project.",
  "map how contributors describe their work":
    "This example asks for a short map of how contributors describe their work. It is demo content, not a live project.",
  "this sample is closed so the closed state can be checked":
    "This example is closed so the closed state can be reviewed. It is demo content, not a live project.",
};

const CARD_SUMMARIES: Record<string, string> = {
  "write a short contributor-facing note": "A short note about how a contributor passport is used.",
  "help shape a public contributor page": "Improve a public contributor page.",
  "map how contributors describe their work": "A short map of how contributors describe their work.",
  "this sample is closed so the closed state can be checked": "A closed sample used to review that state.",
};

export function plainCopy(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/^Example ·\s*/i, "")
    .replace(/^Example (role|description|scope|deliverable|instructions|question|terms only|amount only)\.\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function projectLabel(name: string): string {
  return plainCopy(name);
}

export function listingSummary(summary: string, isDemo: boolean): string {
  const cleaned = plainCopy(summary).replace(/This is not a live project\.?/i, "").trim().replace(/\.$/, "");
  if (!isDemo) return plainCopy(summary);
  const known = DEMO_SUMMARIES[cleaned.toLowerCase()];
  if (known) return known;
  const sentence = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `${sentence}. This is demo content, not a live project.`;
}

export function cardSummary(summary: string): string {
  const cleaned = plainCopy(summary).replace(/This is not a live project\.?/i, "").trim().replace(/\.$/, "");
  const known = CARD_SUMMARIES[cleaned.toLowerCase()];
  if (known) return known;
  const sentence = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}
