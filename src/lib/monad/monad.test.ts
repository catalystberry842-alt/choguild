import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { issueNonce } from "../passport/repo.server.ts";
import { explorerAddressUrl, monadRpcUrls, MONAD_CHAIN_ID } from "../passport/chain.ts";
import { probeMonadRpc } from "./status.server.ts";

type Sql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

function toSql(pg: PGlite): Sql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ""}`;
    return (await pg.query<T>(text, values)).rows;
  }) as unknown as Sql;
  sql.query = async () => [];
  return sql;
}

describe("Monad configuration", () => {
  it("keeps mainnet chain 143 and ignores a non-https RPC override", () => {
    assert.equal(MONAD_CHAIN_ID, 143);
    assert.equal(monadRpcUrls("http://evil.example")[0], "https://rpc.monad.xyz");
    assert.equal(monadRpcUrls("https://rpc.example")[0], "https://rpc.example");
    assert.equal(explorerAddressUrl("0x1111111111111111111111111111111111111111"), "https://monadvision.com/address/0x1111111111111111111111111111111111111111");
    assert.equal(explorerAddressUrl("not-an-address"), null);
  });

  it("rejects a passport challenge that is not Monad mainnet", async () => {
    const pg = new PGlite();
    const sql = toSql(pg);
    await pg.exec(readFileSync(new URL("../../../migrations/0002_passport.sql", import.meta.url), "utf8"));
    const issued = await issueNonce(sql, {
      address: "0x1111111111111111111111111111111111111111",
      chainId: 1,
      domain: "localhost:8080",
      uri: "http://localhost:8080",
    });
    assert.equal("error" in issued, true);
  });

  it("reports a dead RPC instead of a successful connection", async () => {
    const result = await probeMonadRpc("https://127.0.0.1:9");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /did not respond|not Monad/);
  });
});
