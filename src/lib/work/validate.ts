export const WORK_LIMITS = {
  title: 80,
  description: 2000,
  notes: 800,
  links: 6,
  url: 200,
  comment: 500,
} as const;

export type WorkInput = {
  title: string;
  description: string;
  evidenceLinks: string[];
  repoUrl: string;
  documentUrl: string;
  notes: string;
  publicEvidence: boolean;
  submit: boolean;
};

export type WorkRecord = {
  title: string;
  description: string;
  evidenceLinks: string[];
  repoUrl: string | null;
  documentUrl: string | null;
  notes: string | null;
  publicEvidence: boolean;
  submit: boolean;
};

export type WorkErrors = Partial<Record<string, string>>;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function httpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function validateWork(input: WorkInput): { ok: true; value: WorkRecord } | { ok: false; errors: WorkErrors } {
  const errors: WorkErrors = {};
  const title = clean(input.title);
  const description = input.description.trim();
  if (title.length < 4) errors.title = "Title needs at least 4 characters.";
  else if (title.length > WORK_LIMITS.title) errors.title = `Title must be ${WORK_LIMITS.title} characters or fewer.`;
  if (description.length < 20) errors.description = "Describe the work in at least 20 characters.";
  else if (description.length > WORK_LIMITS.description) errors.description = `Description must be ${WORK_LIMITS.description} characters or fewer.`;
  const notes = input.notes.trim();
  if (notes.length > WORK_LIMITS.notes) errors.notes = `Notes must be ${WORK_LIMITS.notes} characters or fewer.`;

  const links: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.evidenceLinks) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const href = httpsUrl(trimmed);
    if (!href || href.length > WORK_LIMITS.url) {
      errors.evidenceLinks = "Evidence links must be https URLs.";
      break;
    }
    if (seen.has(href)) continue;
    seen.add(href);
    links.push(href);
  }
  if (!errors.evidenceLinks && links.length > WORK_LIMITS.links) errors.evidenceLinks = `Add up to ${WORK_LIMITS.links} evidence links.`;

  let repoUrl: string | null = null;
  const repo = input.repoUrl.trim();
  if (repo) {
    repoUrl = httpsUrl(repo);
    if (!repoUrl || repoUrl.length > WORK_LIMITS.url) errors.repoUrl = "Repository link must be an https URL.";
  }
  let documentUrl: string | null = null;
  const document = input.documentUrl.trim();
  if (document) {
    documentUrl = httpsUrl(document);
    if (!documentUrl || documentUrl.length > WORK_LIMITS.url) errors.documentUrl = "Document link must be an https URL.";
  }
  if (input.submit && links.length === 0 && !errors.evidenceLinks) {
    errors.evidenceLinks = "Add at least one https evidence link before submitting.";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      description,
      evidenceLinks: links,
      repoUrl,
      documentUrl,
      notes: notes || null,
      publicEvidence: Boolean(input.publicEvidence),
      submit: input.submit,
    },
  };
}

export function validateReviewComment(action: string, comment: string, note: string): { ok: true; comment: string | null; note: string | null } | { ok: false; error: string } {
  const text = comment.trim();
  const privateNote = note.trim();
  if ((action === "changes_requested" || action === "rejected") && text.length < 4) {
    return { ok: false, error: "Tell the contributor what happened. They can read this comment." };
  }
  if (text.length > WORK_LIMITS.comment || privateNote.length > WORK_LIMITS.comment) {
    return { ok: false, error: `Comments must be ${WORK_LIMITS.comment} characters or fewer.` };
  }
  return { ok: true, comment: text || null, note: privateNote || null };
}
