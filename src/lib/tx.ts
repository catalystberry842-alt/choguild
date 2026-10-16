import type { Sql } from "@/lib/db";

/**
 * Runs `fn` inside one database transaction when the client supports it
 * (Neon pool and PGLite both do). Every write in `fn` must use the `tx`
 * argument. Clients without transactions (simple test doubles) run inline.
 */
export async function withTransaction<T>(sql: Sql, fn: (tx: Sql) => Promise<T>): Promise<T> {
  return sql.transaction ? sql.transaction(fn) : fn(sql);
}
