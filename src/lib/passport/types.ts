import type { ProfileRecord } from "@/lib/passport/validate";

export type PublicProfile = ProfileRecord & {
  id: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
};
