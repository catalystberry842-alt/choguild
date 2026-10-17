import type { Sql } from "@/lib/db";
import { avatarPath, type StoredAvatarType } from "@/lib/passport/avatar";

/** Stores one compressed avatar for a wallet and prunes that wallet's unused uploads. */
export async function storeAvatar(
  sql: Sql,
  wallet: string,
  bytes: Uint8Array,
  type: StoredAvatarType,
): Promise<{ id: string; url: string }> {
  const id = crypto.randomUUID();
  await sql`
    insert into passport_avatars (id, wallet_address, content_type, byte_size, bytes)
    values (${id}, ${wallet}, ${type}, ${bytes.length}, ${bytes})
  `;
  // Keep only the new upload plus whatever the saved passport still points at.
  await sql`
    delete from passport_avatars a
    where a.wallet_address = ${wallet} and a.id <> ${id}
      and not exists (
        select 1 from contributor_profiles p
        where p.wallet_address = ${wallet} and p.avatar_url = '/api/avatar/' || a.id
      )
  `;
  return { id, url: avatarPath(id) };
}

export async function readAvatar(sql: Sql, id: string): Promise<{ type: string; bytes: Uint8Array } | null> {
  const rows = await sql<{ content_type: string; bytes: Uint8Array }>`
    select content_type, bytes from passport_avatars where id = ${id}
  `;
  const row = rows[0];
  if (!row) return null;
  return { type: row.content_type, bytes: row.bytes instanceof Uint8Array ? row.bytes : new Uint8Array(row.bytes as ArrayBuffer) };
}

export async function avatarOwnedBy(sql: Sql, id: string, wallet: string): Promise<boolean> {
  const rows = await sql<{ id: string }>`
    select id from passport_avatars where id = ${id} and wallet_address = ${wallet}
  `;
  return Boolean(rows[0]);
}
