import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

export type TestSql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

export function toSql(pg: PGlite): TestSql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ""}`;
    return (await pg.query<T>(text, values)).rows;
  }) as unknown as TestSql;
  sql.query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows;
  (sql as TestSql & { transaction?: unknown }).transaction = <R>(fn: (tx: TestSql) => Promise<R>) =>
    pg.transaction((tx) => fn(toSql(tx as unknown as PGlite)));
  return sql;
}

/** Fresh in-memory PGLite with every shipped migration applied in order. */
export async function freshDb(): Promise<{ pg: PGlite; sql: TestSql }> {
  const pg = new PGlite();
  const dir = new URL("../../../migrations/", import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(new URL(file, dir), "utf8"));
  return { pg, sql: toSql(pg) };
}
