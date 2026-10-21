import { parseAvatarRef } from "@/lib/passport/avatar";

type OwnsCheck = (wallet: string, tokenId: number) => Promise<boolean | null>;

/**
 * Error for a "Use my Chog" avatar the wallet does not own, else null.
 * Live ownerOf first (catches tokens sold minutes ago); the full holder snapshot
 * (every token, not the 12 shown on passports) when the RPC is down. Fails open
 * only when neither source can answer.
 */
export async function chogAvatarError(wallet: string, avatarUrl: string, live: OwnsCheck, fallback: OwnsCheck): Promise<string | null> {
  const ref = parseAvatarRef(avatarUrl);
  if (ref.kind !== "chog") return null;
  let owns = await live(wallet, ref.tokenId).catch(() => null);
  if (owns === null) owns = await fallback(wallet, ref.tokenId).catch(() => null);
  return owns === false ? "That Chog is not held by this wallet." : null;
}
