/**
 * Chog Genesis (CHOG): the official Chog NFT collection on Monad mainnet.
 * Verified 15 Oct 2026: referenced by the official mint site mint.chog.xyz (chog.xyz),
 * MonadScan token tracker "Chog Genesis (CHOG)", and onchain reads (name/symbol,
 * ERC-721 + metadata interfaces, totalSupply 1969, token ids 1..1969).
 */
export const CHOG_CONTRACT = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763" as const;
export const CHOG_SUPPLY = 1969;
export const CHOG_EXPLORER_URL = `https://monadscan.com/token/${CHOG_CONTRACT}`;

/** Holder perk: +10% of guild XP, rounded, capped at +50. Onchain XP is never boosted. */
export const CHOG_BOOST_RATE = 0.1;
export const CHOG_BOOST_CAP = 50;

export function chogBonusFor(baseGuildXp: number, holder: boolean): number {
  if (!holder || !Number.isFinite(baseGuildXp) || baseGuildXp <= 0) return 0;
  return Math.min(CHOG_BOOST_CAP, Math.round(baseGuildXp * CHOG_BOOST_RATE));
}

export type ChogHolding = { count: number; tokenIds: number[] };

/** Public image URL for a token, served (and edge-cached) by our own route. */
export function chogImageUrl(tokenId: number): string {
  return `/api/chog/${tokenId}`;
}

export function isChogTokenId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= CHOG_SUPPLY;
}

/**
 * tokenURI is `ipfs://<metadataCid>/<n>.json`; the image for metadata n is
 * `ipfs://<imageCid>/<n>.webp` (n is shuffled vs. the token id, so read tokenURI first).
 */
export const CHOG_IMAGE_CID = "bafybeihau2egcccbdxymeckmmbrqytbfor5gkt3en6d5fsbueymdbq7g6e";

export function imagePathFromTokenUri(uri: string): string | null {
  const match = /^ipfs:\/\/[a-z0-9]+\/(\d{1,5})\.json$/i.exec(uri.trim());
  if (!match) return null;
  return `${CHOG_IMAGE_CID}/${Number(match[1])}.webp`;
}

/**
 * $CHOG, the Chog memecoin on Monad. Verified 22 Oct 2026: listed on the official site chog.xyz,
 * and onchain name() "Chog", symbol() "CHOG", decimals() 18 via the public Monad RPC.
 */
export const CHOG_TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777" as const;
export const CHOG_TOKEN_DECIMALS = 18;
export const CHOG_TOKEN_URL = `https://monadscan.com/token/${CHOG_TOKEN}`;
