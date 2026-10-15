import { z } from "zod";
import { REVIEW_STATUSES } from "@/lib/board/copy";
import { REVIEW_ACTIONS } from "@/lib/work/copy";

/** Boundary schemas for server functions. Field-level rules stay in the */
/** per-domain validate.ts files; these only reject malformed payloads. */
const text = (max: number) => z.string().max(max);
const id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, "Invalid id");
const links = z.array(text(2_000)).max(20);

export const idSchema = id;
export const usernameSchema = z.string().trim().min(1).max(40);

export const opportunitySchema = z.object({
  projectName: text(200), projectLogoUrl: text(2_000), title: text(200), summary: text(600),
  description: text(10_000), scope: text(10_000), deliverables: text(10_000),
  requiredSkills: z.array(text(60)).max(30), preferredSkills: z.array(text(60)).max(30),
  category: text(60), compensationType: text(60), compensationDetails: text(1_000),
  timeCommitment: text(200), deadline: text(40), instructions: text(5_000), question: text(1_000),
  positions: text(10), publish: z.boolean(), holdersOnly: z.boolean().optional(),
});

export const applicationSchema = z.object({
  introduction: text(5_000), suitability: text(5_000), experience: text(5_000), links, extraAnswer: text(5_000),
});

export const workSchema = z.object({
  title: text(200), description: text(10_000), evidenceLinks: links, repoUrl: text(2_000),
  documentUrl: text(2_000), notes: text(5_000), publicEvidence: z.boolean(), submit: z.boolean(),
});

export const profileSchema = z.object({
  username: text(40), displayName: text(80), biography: text(2_000), avatarUrl: text(2_000),
  skills: z.array(text(60)).max(30), portfolioUrl: text(2_000), githubUrl: text(2_000), xUrl: text(2_000),
  otherLinks: z.array(z.object({ label: text(60), url: text(2_000) })).max(10),
  interests: text(1_000), visibility: z.enum(["public", "unlisted"]),
});

export const opportunityStatusSchema = z.object({ id, status: z.enum(["open", "closed", "filled"]) });
export const reviewApplicationSchema = z.object({ id, status: z.enum(REVIEW_STATUSES), feedback: text(5_000) });
export const reviewWorkSchema = z.object({
  id, action: z.enum(REVIEW_ACTIONS), comment: text(5_000), privateNote: text(5_000),
});
export const nonceSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid address"), chainId: z.number().int().positive(),
});
export const verifySchema = z.object({
  message: text(4_000), signature: z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid signature").max(20_000),
});

/** Parse or throw a short, user-safe error. */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`Invalid request${issue?.path.length ? ` (${issue.path.join(".")})` : ""}.`);
  }
  return result.data;
}
