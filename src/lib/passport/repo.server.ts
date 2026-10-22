import type { Sql } from "@/lib/db";
import { MONAD_CHAIN_ID } from "@/lib/passport/chain";
import type { PublicProfile } from "@/lib/passport/types";
import { getAddress, type Hex } from "viem";
import { generateSiweNonce } from "viem/siwe";
import { buildPassportMessage, signatureMatchesMessage } from "@/lib/passport/siwe";
import { avatarOwnedBy } from "@/lib/passport/avatar.server";
import { parseAvatarRef } from "@/lib/passport/avatar";
import {
  normalizeUsername,
  storedAddress,
  validateProfile,
  type FieldErrors,
  type ProfileInput,
} from "@/lib/passport/validate";

export type { PublicProfile };

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  biography: string;
  avatar_url: string | null;
  skills: unknown;
  github_url: string | null;
  x_url: string | null;
  other_links: unknown;
  interests: string | null;
  wallet_address: string;
  visibility: "public" | "unlisted";
  created_at: string;
  updated_at: string;
};

export type MutationResult =
  | { ok: true; profile: PublicProfile }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toPublic(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    biography: row.biography,
    avatarUrl: row.avatar_url,
    skills: asArray<string>(row.skills),
    githubUrl: row.github_url,
    xUrl: row.x_url,
    otherLinks: asArray<{ label: string; url: string }>(row.other_links),
    interests: row.interests,
    visibility: row.visibility,
    walletAddress: row.wallet_address.startsWith("chog:") ? row.wallet_address : getAddress(row.wallet_address),
    chogId: row.wallet_address.startsWith("chog:") ? Number(row.wallet_address.slice(5)) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function selectByUsername(sql: Sql, username: string): Promise<PublicProfile | null> {
  const rows = await sql<ProfileRow>`
    select id, username, display_name, biography, avatar_url, skills,
      github_url, x_url, other_links, interests, wallet_address, visibility,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from contributor_profiles
    where username = ${username}
  `;
  return rows[0] ? toPublic(rows[0]) : null;
}

async function selectByWallet(sql: Sql, address: string): Promise<PublicProfile | null> {
  const rows = await sql<ProfileRow>`
    select id, username, display_name, biography, avatar_url, skills,
      github_url, x_url, other_links, interests, wallet_address, visibility,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from contributor_profiles
    where wallet_address = ${address}
  `;
  return rows[0] ? toPublic(rows[0]) : null;
}

export async function findPublicProfile(sql: Sql, username: string): Promise<PublicProfile | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return selectByUsername(sql, normalized);
}

export async function findProfileForWallet(sql: Sql, address: string): Promise<PublicProfile | null> {
  const stored = storedAddress(address);
  if (!stored) return null;
  return selectByWallet(sql, stored);
}

function conflictField(error: unknown): "username" | "wallet" | null {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (message.includes("contributor_profiles_username") || message.includes("key (username)")) return "username";
  if (message.includes("contributor_profiles_wallet") || message.includes("key (wallet_address)")) return "wallet";
  return null;
}

/** Uploaded avatars must belong to this wallet; external URLs only survive if already saved. */
async function checkAvatarOwnership(sql: Sql, wallet: string, avatarUrl: string | null): Promise<string | null> {
  const ref = parseAvatarRef(avatarUrl);
  if (ref.kind === "upload") {
    return (await avatarOwnedBy(sql, ref.id, wallet)) ? null : "Upload the avatar again from this wallet.";
  }
  if (ref.kind === "external") {
    const rows = await sql<{ avatar_url: string | null }>`
      select avatar_url from contributor_profiles where wallet_address = ${wallet}
    `;
    return rows[0]?.avatar_url === avatarUrl ? null : "Upload an image for your avatar.";
  }
  return null;
}

async function writeProfile(
  sql: Sql,
  sessionAddress: string,
  input: ProfileInput,
  mode: "create" | "update",
): Promise<MutationResult> {
  const stored = storedAddress(sessionAddress);
  if (!stored) return { ok: false, error: "The session wallet address is not valid." };
  const parsed = validateProfile(input);
  if (!parsed.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.errors };

  const value = parsed.value;
  const avatarError = await checkAvatarOwnership(sql, stored, value.avatarUrl);
  if (avatarError) return { ok: false, error: avatarError, fieldErrors: { avatarUrl: avatarError } };
  const skills = JSON.stringify(value.skills);
  const links = JSON.stringify(value.otherLinks);

  try {
    if (mode === "create") {
      const existing = await selectByWallet(sql, stored);
      if (existing) {
        return {
          ok: false,
          error: "This Chog already has a passport. Edit that profile instead.",
          fieldErrors: { form: "This Chog already has a passport." },
        };
      }
      const id = crypto.randomUUID();
      await sql`
        insert into contributor_profiles (
          id, username, display_name, biography, avatar_url, skills,
          github_url, x_url, other_links, interests, wallet_address, visibility
        ) values (
          ${id}, ${value.username}, ${value.displayName}, ${value.biography}, ${value.avatarUrl},
          ${skills}::jsonb, ${value.githubUrl}, ${value.xUrl},
          ${links}::jsonb, ${value.interests}, ${stored}, ${value.visibility}
        )
      `;
    } else {
      const updated = await sql<{ id: string }>`
        update contributor_profiles set
          username = ${value.username},
          display_name = ${value.displayName},
          biography = ${value.biography},
          avatar_url = ${value.avatarUrl},
          skills = ${skills}::jsonb,
          github_url = ${value.githubUrl},
          x_url = ${value.xUrl},
          other_links = ${links}::jsonb,
          interests = ${value.interests},
          visibility = ${value.visibility},
          updated_at = now()
        where wallet_address = ${stored}
        returning id
      `;
      if (!updated[0]) {
        return { ok: false, error: "You can only edit the passport of the Chog you are acting as." };
      }
    }
  } catch (error) {
    const field = conflictField(error);
    if (field === "username") {
      return {
        ok: false,
        error: "That username is already taken.",
        fieldErrors: { username: "That username is already taken." },
      };
    }
    if (field === "wallet") {
      return { ok: false, error: "This Chog already has a passport." };
    }
    throw error;
  }

  const profile = await selectByWallet(sql, stored);
  if (!profile) return { ok: false, error: "The passport was saved but could not be read back." };
  return { ok: true, profile };
}

export function createProfile(sql: Sql, sessionAddress: string, input: ProfileInput) {
  return writeProfile(sql, sessionAddress, input, "create");
}

export function updateProfile(sql: Sql, sessionAddress: string, input: ProfileInput) {
  return writeProfile(sql, sessionAddress, input, "update");
}

/** Sign-in challenges: per-requester budget, and only the newest few stay open per wallet. */
export const NONCE_REQUESTER_LIMIT = 20;
export const NONCE_WINDOW_SECONDS = 10 * 60;
export const NONCE_OPEN_PER_ADDRESS = 3;

export async function issueNonce(
  sql: Sql,
  input: { address: string; chainId: number; domain: string; uri: string; requester?: string },
): Promise<{ message: string } | { error: string }> {
  const checksum = storedAddress(input.address);
  const normalized = checksum ? getAddress(checksum) : null;
  if (!normalized || input.chainId !== MONAD_CHAIN_ID) {
    return { error: "Switch to Monad mainnet (chain 143) before verifying this wallet." };
  }
  const issuedAt = new Date();
  const nonce = generateSiweNonce();
  let message: string;
  let expiresAt: Date;
  try {
    const built = buildPassportMessage({
      address: normalized,
      chainId: input.chainId,
      domain: input.domain,
      uri: input.uri,
      nonce,
      issuedAt,
    });
    message = built.message;
    expiresAt = built.expiresAt;
  } catch {
    return {
      error:
        "This site address cannot be used for a sign-in message. Open Choguild on its public address and try again.",
    };
  }
  await sql`delete from passport_nonces where expires_at < now() - interval '1 hour'`;
  // Limit by who is asking (hashed client IP), never by the target wallet, so
  // nobody can lock another wallet out by spamming challenges for it.
  const requester = input.requester ?? "unknown";
  const recent = await sql<{ count: string }>`
    select count(*)::text as count from passport_nonces
    where requester = ${requester} and created_at > now() - make_interval(secs => ${NONCE_WINDOW_SECONDS})
  `;
  if (Number(recent[0]?.count ?? 0) >= NONCE_REQUESTER_LIMIT) {
    return { error: "Too many sign-in requests from this network. Wait a few minutes and try again." };
  }
  // A new challenge always succeeds: older open ones for the wallet beyond the newest few are evicted.
  await sql`
    update passport_nonces set used_at = now(), expires_at = now() where id in (
      select id from passport_nonces
      where address = ${checksum} and used_at is null and expires_at > now()
      order by created_at desc
      offset ${NONCE_OPEN_PER_ADDRESS - 1}
    )
  `;
  await sql`
    insert into passport_nonces (id, address, nonce, message, expires_at, requester)
    values (${crypto.randomUUID()}, ${checksum}, ${nonce}, ${message}, ${expiresAt.toISOString()}, ${requester})
  `;
  return { message };
}

export async function consumeNonce(
  sql: Sql,
  input: { message: string; signature: Hex; domain: string; now?: Date },
): Promise<{ ok: true; address: string } | { ok: false; error: string }> {
  const chainLine = input.message.match(/\nChain ID: (\d+)/)?.[1];
  if (chainLine !== String(MONAD_CHAIN_ID)) {
    return { ok: false, error: "The signed message is not for Monad mainnet." };
  }
  const parsedNonce = input.message.match(/\nNonce: ([^\n]+)/)?.[1];
  if (!parsedNonce) return { ok: false, error: "The signed message is missing a nonce." };
  const rows = await sql<{ address: string; message: string; nonce: string }>`
    select address, message, nonce
    from passport_nonces
    where nonce = ${parsedNonce} and used_at is null and expires_at > now()
  `;
  const row = rows[0];
  if (!row) return { ok: false, error: "That sign-in challenge expired or was already used. Request a new one." };
  if (row.message !== input.message) {
    return { ok: false, error: "The signed message does not match the challenge that was issued." };
  }
  const address = getAddress(row.address);
  let valid = false;
  try {
    valid = await signatureMatchesMessage({
      message: input.message,
      signature: input.signature,
      domain: input.domain,
      nonce: row.nonce,
      address,
      now: input.now,
    });
  } catch {
    return { ok: false, error: "The signature could not be verified." };
  }
  if (!valid) return { ok: false, error: "The signature does not match this wallet or this challenge." };
  const used = await sql<{ id: string }>`
    update passport_nonces
    set used_at = now()
    where nonce = ${row.nonce} and used_at is null
    returning id
  `;
  if (!used[0]) return { ok: false, error: "That sign-in challenge was already used." };
  return { ok: true, address: row.address };
}

export async function createPassportSession(sql: Sql, address: string): Promise<string> {
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    insert into passport_sessions (id, address, expires_at)
    values (${id}, ${address}, ${expires})
  `;
  return id;
}

export async function readLiveSession(sql: Sql, sessionId: string): Promise<string | null> {
  const rows = await sql<{ address: string }>`
    select address from passport_sessions
    where id = ${sessionId} and expires_at > now()
  `;
  return rows[0]?.address ?? null;
}

export async function deletePassportSession(sql: Sql, sessionId: string): Promise<void> {
  await sql`delete from passport_sessions where id = ${sessionId}`;
}
