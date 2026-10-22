import type { ProfileRecord } from "@/lib/passport/validate";

export type PublicProfile = ProfileRecord & {
  id: string;
  /** Actor key `chog:<id>` (legacy rows: a wallet address). */
  walletAddress: string;
  chogId: number | null;
  createdAt: string;
  updatedAt: string;
};
