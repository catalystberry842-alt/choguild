/**
 * The Chog is the member. Every passport, listing, application, submission and
 * XP event is keyed to an actor string `chog:<tokenId>`, never to a wallet.
 * Whoever owns the token right now (live ownerOf) acts as it, so the record
 * travels with the NFT on transfer.
 */
import { isChogTokenId } from "./chog";

export const ACTOR_PREFIX = "chog:";

export function actorKey(tokenId: number): string {
  return `${ACTOR_PREFIX}${tokenId}`;
}

export function chogIdOf(actor: string | null | undefined): number | null {
  if (!actor || !actor.startsWith(ACTOR_PREFIX)) return null;
  const id = Number(actor.slice(ACTOR_PREFIX.length));
  return isChogTokenId(id) ? id : null;
}

export function isChogActor(actor: string | null | undefined): boolean {
  return chogIdOf(actor) !== null;
}
