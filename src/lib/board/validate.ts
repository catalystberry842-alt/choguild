import {
  CATEGORIES,
  COMPENSATION_TYPES,
  type Category,
  type CompensationType,
  type OpportunityStatus,
} from "@/lib/board/copy";

export const BOARD_LIMITS = {
  title: 80,
  project: 60,
  summary: 180,
  description: 4000,
  scope: 2000,
  deliverables: 2000,
  skill: 32,
  skillCount: 8,
  details: 240,
  time: 80,
  instructions: 1000,
  question: 200,
  intro: 600,
  suitability: 800,
  experience: 600,
  extra: 600,
  link: 200,
  linkCount: 4,
  feedback: 500,
} as const;

export type OpportunityInput = {
  projectName: string;
  projectLogoUrl: string;
  title: string;
  summary: string;
  description: string;
  scope: string;
  deliverables: string;
  requiredSkills: string[];
  preferredSkills: string[];
  category: string;
  compensationType: string;
  compensationDetails: string;
  timeCommitment: string;
  deadline: string;
  instructions: string;
  question: string;
  positions: string;
  publish: boolean;
};

export type OpportunityRecord = {
  projectName: string;
  projectLogoUrl: string | null;
  title: string;
  summary: string;
  description: string;
  scope: string;
  deliverables: string;
  requiredSkills: string[];
  preferredSkills: string[];
  category: Category;
  compensationType: CompensationType;
  compensationDetails: string | null;
  timeCommitment: string | null;
  deadline: string | null;
  instructions: string;
  question: string | null;
  positions: number | null;
  status: Extract<OpportunityStatus, "draft" | "open">;
};

export type ApplicationInput = {
  introduction: string;
  suitability: string;
  experience: string;
  links: string[];
  extraAnswer: string;
};

export type ApplicationRecord = {
  introduction: string;
  suitability: string;
  experience: string | null;
  links: string[];
  extraAnswer: string | null;
};

export type BoardErrors = Partial<Record<string, string>>;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function requiredText(
  value: string,
  key: string,
  label: string,
  min: number,
  max: number,
  errors: BoardErrors,
): string {
  const text = key === "description" || key === "scope" || key === "deliverables" || key === "instructions" || key === "introduction" || key === "suitability"
    ? value.trim()
    : clean(value);
  if (text.length < min) errors[key] = `${label} needs at least ${min} characters.`;
  else if (text.length > max) errors[key] = `${label} must be ${max} characters or fewer.`;
  return text;
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

function skills(values: string[], key: string, errors: BoardErrors, required: boolean): string[] {
  const next: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const skill = clean(raw);
    if (!skill) continue;
    if (skill.length < 2 || skill.length > BOARD_LIMITS.skill) {
      errors[key] = `Each skill must be 2–${BOARD_LIMITS.skill} characters.`;
      return [];
    }
    const id = skill.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(skill);
  }
  if (next.length > BOARD_LIMITS.skillCount) {
    errors[key] = `Add up to ${BOARD_LIMITS.skillCount} skills.`;
  } else if (required && next.length === 0) {
    errors[key] = "Add at least one required skill.";
  }
  return next;
}

export function validateOpportunity(
  input: OpportunityInput,
): { ok: true; value: OpportunityRecord } | { ok: false; errors: BoardErrors } {
  const errors: BoardErrors = {};
  const title = requiredText(input.title, "title", "Title", 4, BOARD_LIMITS.title, errors);
  const projectName = requiredText(input.projectName, "projectName", "Project name", 2, BOARD_LIMITS.project, errors);
  const summary = requiredText(input.summary, "summary", "Summary", 20, BOARD_LIMITS.summary, errors);
  const description = requiredText(input.description, "description", "Description", 40, BOARD_LIMITS.description, errors);
  const scope = requiredText(input.scope, "scope", "Scope", 20, BOARD_LIMITS.scope, errors);
  const deliverables = requiredText(input.deliverables, "deliverables", "Deliverables", 20, BOARD_LIMITS.deliverables, errors);
  const instructions = requiredText(input.instructions, "instructions", "Application instructions", 10, BOARD_LIMITS.instructions, errors);
  const requiredSkills = skills(input.requiredSkills, "requiredSkills", errors, true);
  const preferredSkills = skills(input.preferredSkills, "preferredSkills", errors, false);

  const category = CATEGORIES.find((item) => item === input.category);
  if (!category) errors.category = "Choose a category.";
  const compensationType = COMPENSATION_TYPES.find((item) => item === input.compensationType);
  if (!compensationType) errors.compensationType = "Choose a compensation type.";

  let compensationDetails: string | null = null;
  const details = clean(input.compensationDetails);
  if (compensationType && compensationType !== "unpaid") {
    if (details.length < 4) errors.compensationDetails = "Describe the terms. Do not imply a guaranteed payout.";
    else if (details.length > BOARD_LIMITS.details) errors.compensationDetails = `Compensation details must be ${BOARD_LIMITS.details} characters or fewer.`;
    else compensationDetails = details;
  } else if (details) {
    errors.compensationDetails = "Leave compensation details empty for unpaid collaboration.";
  }

  const time = clean(input.timeCommitment);
  const timeCommitment = time ? time : null;
  if (time.length > BOARD_LIMITS.time) errors.timeCommitment = `Time commitment must be ${BOARD_LIMITS.time} characters or fewer.`;

  const questionText = clean(input.question);
  const question = questionText || null;
  if (questionText.length > BOARD_LIMITS.question) errors.question = `The question must be ${BOARD_LIMITS.question} characters or fewer.`;

  let projectLogoUrl: string | null = null;
  const logo = input.projectLogoUrl.trim();
  if (logo) {
    projectLogoUrl = httpsUrl(logo);
    if (!projectLogoUrl || projectLogoUrl.length > BOARD_LIMITS.link) errors.projectLogoUrl = "Logo must be an https URL.";
  }

  let deadline: string | null = null;
  const rawDeadline = input.deadline.trim();
  if (rawDeadline) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDeadline)) errors.deadline = "Use a valid date.";
    else {
      const end = new Date(`${rawDeadline}T23:59:59.000Z`);
      if (Number.isNaN(end.getTime())) errors.deadline = "Use a valid date.";
      else if (input.publish && end.getTime() <= Date.now()) errors.deadline = "The deadline must be in the future to publish.";
      else deadline = end.toISOString();
    }
  }

  let positions: number | null = null;
  const rawPositions = input.positions.trim();
  if (rawPositions) {
    const parsed = Number(rawPositions);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) errors.positions = "Positions must be a whole number from 1 to 20.";
    else positions = parsed;
  }

  if (Object.keys(errors).length > 0 || !category || !compensationType) return { ok: false, errors };
  return {
    ok: true,
    value: {
      projectName,
      projectLogoUrl,
      title,
      summary,
      description,
      scope,
      deliverables,
      requiredSkills,
      preferredSkills,
      category,
      compensationType,
      compensationDetails,
      timeCommitment,
      deadline,
      instructions,
      question,
      positions,
      status: input.publish ? "open" : "draft",
    },
  };
}

export function validateApplication(
  input: ApplicationInput,
): { ok: true; value: ApplicationRecord } | { ok: false; errors: BoardErrors } {
  const errors: BoardErrors = {};
  const introduction = requiredText(input.introduction, "introduction", "Introduction", 20, BOARD_LIMITS.intro, errors);
  const suitability = requiredText(input.suitability, "suitability", "Suitability", 20, BOARD_LIMITS.suitability, errors);
  const experienceText = input.experience.trim();
  if (experienceText.length > BOARD_LIMITS.experience) errors.experience = `Experience must be ${BOARD_LIMITS.experience} characters or fewer.`;
  const extraText = input.extraAnswer.trim();
  if (extraText.length > BOARD_LIMITS.extra) errors.extraAnswer = `The answer must be ${BOARD_LIMITS.extra} characters or fewer.`;

  const links: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.links) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const href = httpsUrl(trimmed);
    if (!href || href.length > BOARD_LIMITS.link) {
      errors.links = "Work samples must be https URLs.";
      break;
    }
    if (seen.has(href)) continue;
    seen.add(href);
    links.push(href);
  }
  if (!errors.links && links.length > BOARD_LIMITS.linkCount) errors.links = `Add up to ${BOARD_LIMITS.linkCount} links.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      introduction,
      suitability,
      experience: experienceText || null,
      links,
      extraAnswer: extraText || null,
    },
  };
}

export function validateFeedback(value: string): { ok: true; feedback: string | null } | { ok: false; error: string } {
  const text = value.trim();
  if (text.length > BOARD_LIMITS.feedback) return { ok: false, error: `Feedback must be ${BOARD_LIMITS.feedback} characters or fewer.` };
  return { ok: true, feedback: text || null };
}
