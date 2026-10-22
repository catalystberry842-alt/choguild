import type { ApplicationStatus } from "@/lib/board/copy";

export type PosterInfo = {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type OpportunityCard = {
  id: string;
  projectName: string;
  projectLogoUrl: string | null;
  title: string;
  summary: string;
  requiredSkills: string[];
  category: string;
  compensationType: string;
  compensationDetails: string | null;
  deadline: string | null;
  status: string;
  accepting: boolean;
  myApplicationStatus: ApplicationStatus | null;
  myApplicationId: string | null;
  createdAt: string;
  /** Only Chog Genesis holders may apply (checked onchain at apply time). */
  holdersOnly: boolean;
  /** $CHOG reward the publisher pays each accepted Chog's holder, or null. */
  rewardChog: string | null;
  /** Publisher passport, when they have one. */
  poster: PosterInfo;
  /** Applications received (any status). */
  applicantCount: number;
  /** Accepted applications (used for filled/total positions). */
  acceptedCount: number;
  positions: number | null;
};

export type OpportunityDetail = OpportunityCard & {
  ownerWallet: string;
  description: string;
  scope: string;
  deliverables: string;
  preferredSkills: string[];
  timeCommitment: string | null;
  instructions: string;
  question: string | null;
  updatedAt: string;
  mine: boolean;
};

export type ApplicationView = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  projectName: string;
  introduction: string;
  suitability: string;
  experience: string | null;
  links: string[];
  extraAnswer: string | null;
  status: ApplicationStatus;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
  username: string | null;
  displayName: string | null;
  skills: string[];
  viewer: "contributor" | "creator";
  history: { status: string; createdAt: string }[];
};

export type ApplicationListItem = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  projectName: string;
  status: ApplicationStatus;
  createdAt: string;
  feedback: string | null;
};
