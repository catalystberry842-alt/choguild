import type { WorkStatus } from "@/lib/work/copy";

export type WorkVersion = {
  version: number;
  title: string;
  description: string;
  repoUrl: string | null;
  documentUrl: string | null;
  notes: string | null;
  evidenceLinks: string[];
  createdAt: string;
};

export type WorkEvent = {
  fromStatus: string | null;
  toStatus: string;
  comment: string | null;
  privateNote: string | null;
  createdAt: string;
};

export type WorkDetail = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  projectName: string;
  applicationId: string;
  status: WorkStatus;
  publicEvidence: boolean;
  createdAt: string;
  updatedAt: string;
  viewer: "contributor" | "reviewer";
  versions: WorkVersion[];
  history: WorkEvent[];
};

export type WorkListItem = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  projectName: string;
  title: string;
  status: WorkStatus;
  updatedAt: string;
  username: string | null;
  displayName: string | null;
};

export type EligibleWork = {
  applicationId: string;
  opportunityId: string;
  opportunityTitle: string;
  projectName: string;
};

export type PublicContribution = {
  id: string;
  title: string;
  projectName: string;
  opportunityTitle: string;
  skills: string[];
  acceptedAt: string;
  evidence: { label: string; url: string }[] | null;
};

export type ContributionSummary = {
  accepted: number;
  opportunities: number;
  skills: string[];
  items: PublicContribution[];
};
