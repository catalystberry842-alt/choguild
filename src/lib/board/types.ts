import type { ApplicationStatus } from "@/lib/board/copy";

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
  isDemo: boolean;
  accepting: boolean;
  myApplicationStatus: ApplicationStatus | null;
  myApplicationId: string | null;
  createdAt: string;
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
  positions: number | null;
  updatedAt: string;
  mine: boolean;
};

export type ApplicationView = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  projectName: string;
  isDemo: boolean;
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
