import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { resolveSessionSecret } from "@/lib/passport/session-secret";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import type { Hex } from "viem";
import { completionSummary, profileCompletion } from "./completion.ts";
import { sameOriginDecision } from "./origin.ts";
import {
  consumeNonce,
  createPassportSession,
  createProfile,
  deletePassportSession,
  findProfileForWallet,
  findPublicProfile,
  issueNonce,
  readLiveSession,
  updateProfile,
} from "./repo.server.ts";
import { buildPassportMessage, signatureMatchesMessage } from "./siwe.ts";
import { validateProfile, type ProfileInput } from "./validate.ts";
import { walletErrorMessage } from "./wallet-error.ts";

const DOMAIN = "localhost:8080";
const URI = "http://localhost:8080";

type Sql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

function toSql(pg: PGlite): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) {
      text += `$${index + 1}${strings[index + 1] ?? ""}`;
    }
    const result = await pg.query<T>(text, values);
    return result.rows;
  }) as unknown as Sql;
  sql.query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  };
  return sql;
}

function profile(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    username: "ada_lane",
    displayName: "Ada Lane",
    biography: "I write field notes for contributors.",
    avatarUrl: "",
    skills: ["Research"],
    portfolioUrl: "",
    githubUrl: "",
    xUrl: "",
    otherLinks: [],
    interests: "",
    visibility: "public",
    ...overrides,
  };
}

describe("profile validation", () => {
  it("normalizes a username and trims surrounding whitespace", () => {
    const result = validateProfile(
      profile({
        username: "  Ada_Lane  ",
        displayName: "  Ada   Lane ",
        biography: "  I write field notes for contributors.  ",
      }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.username, "ada_lane");
    assert.equal(result.value.displayName, "Ada Lane");
    assert.equal(result.value.biography, "I write field notes for contributors.");
  });

  it("rejects invalid usernames, reserved names, and bad URLs", () => {
    const cases: Array<[Partial<ProfileInput>, keyof ProfileInput]> = [
      [{ username: "ab" }, "username"],
      [{ username: "1ada" }, "username"],
      [{ username: "has-dash" }, "username"],
      [{ username: "admin" }, "username"],
      [{ displayName: "   " }, "displayName"],
      [{ biography: "" }, "biography"],
      [{ biography: "x".repeat(281) }, "biography"],
      [{ avatarUrl: "http://example.com/a.png" }, "avatarUrl"],
      [{ avatarUrl: "https://user:pw@example.com/a.png" }, "avatarUrl"],
      [{ githubUrl: "https://github.com" }, "githubUrl"],
      [{ githubUrl: "https://example.com/octo" }, "githubUrl"],
      [{ xUrl: "https://example.com/ada" }, "xUrl"],
      [{ portfolioUrl: "not a url" }, "portfolioUrl"],
      [{ interests: "i".repeat(161) }, "interests"],
      [{ visibility: "secret" as "public" }, "visibility"],
    ];
    for (const [overrides, field] of cases) {
      const result = validateProfile(profile(overrides));
      assert.equal(result.ok, false, `expected ${field} to fail`);
      if (result.ok) continue;
      assert.ok(result.errors[field], `missing error for ${field}`);
    }
  });

  it("accepts github and x urls and collapses duplicate skills", () => {
    const result = validateProfile(
      profile({
        skills: ["Design", "design", "Development"],
        githubUrl: "https://github.com/ada",
        xUrl: "https://x.com/ada",
        portfolioUrl: "https://example.com/ada",
        otherLinks: [{ label: "Site", url: "https://example.com/notes" }],
      }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.value.skills, ["Design", "Development"]);
    assert.equal(result.value.githubUrl, "https://github.com/ada");
    assert.equal(result.value.xUrl, "https://x.com/ada");
  });

  it("limits skills and other links", () => {
    const skills = Array.from({ length: 13 }, (_, index) => `Skill ${index + 1}`);
    const tooManySkills = validateProfile(profile({ skills }));
    assert.equal(tooManySkills.ok, false);
    if (!tooManySkills.ok) assert.match(tooManySkills.errors.skills ?? "", /12/);

    const links = Array.from({ length: 5 }, (_, index) => ({
      label: `Link ${index}`,
      url: `https://example.com/${index}`,
    }));
    const tooManyLinks = validateProfile(profile({ otherLinks: links }));
    assert.equal(tooManyLinks.ok, false);
    if (!tooManyLinks.ok) assert.match(tooManyLinks.errors.otherLinks ?? "", /4/);
  });
});

describe("profile completion", () => {
  it("counts five profile details and is not a score", () => {
    const empty = profileCompletion({
      biography: "Short",
      skills: [],
      portfolioUrl: null,
      githubUrl: null,
      xUrl: null,
      otherLinks: [],
      avatarUrl: null,
    });
    assert.equal(empty.length, 5);
    assert.equal(completionSummary(empty), "0 of 5 profile details");

    const full = profileCompletion({
      biography: "This biography is long enough to count as a profile detail.",
      skills: ["Design"],
      portfolioUrl: "https://example.com",
      githubUrl: null,
      xUrl: null,
      otherLinks: [{ url: "https://example.com/other" }],
      avatarUrl: "https://example.com/a.png",
    });
    assert.equal(completionSummary(full), "5 of 5 profile details");
    assert.ok(full.every((item) => item.done));
  });
});

describe("wallet errors", () => {
  it("explains rejection and a missing provider", () => {
    assert.match(walletErrorMessage({ code: 4001, message: "no" }, "connect"), /Connection cancelled/);
    assert.match(
      walletErrorMessage({ name: "UserRejectedRequestError", message: "User rejected the request." }, "sign"),
      /Signature cancelled/,
    );
    assert.match(walletErrorMessage(new Error("Provider not found"), "connect"), /No wallet found/);
    assert.match(walletErrorMessage(new Error(""), "switch"), /switch to Monad/);
  });
});

describe("request origin", () => {
  it("allows same-origin posts and blocks cross-site posts", () => {
    assert.equal(
      sameOriginDecision({
        origin: "https://preview.example.com",
        secFetchSite: "same-origin",
        expectedOrigin: "https://preview.example.com",
      }).ok,
      true,
    );
    const blocked = sameOriginDecision({
      origin: "https://evil.example",
      secFetchSite: "cross-site",
      expectedOrigin: "https://preview.example.com",
    });
    assert.equal(blocked.ok, false);
    const mismatched = sameOriginDecision({
      origin: "https://evil.example",
      secFetchSite: "same-site",
      expectedOrigin: "https://preview.example.com",
    });
    assert.equal(mismatched.ok, false);
  });
});

describe("siwe signatures", () => {
  it("accepts an EOA signature and rejects a different statement or an expired message", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const issuedAt = new Date();
    const { message } = buildPassportMessage({
      address: account.address,
      chainId: 143,
      domain: DOMAIN,
      uri: URI,
      nonce: generateSiweNonce(),
      issuedAt,
    });
    const signature = await account.signMessage({ message });
    assert.equal(
      await signatureMatchesMessage({
        message,
        signature,
        domain: DOMAIN,
        nonce: message.match(/\nNonce: ([^\n]+)/)?.[1] ?? "",
        address: account.address,
        now: issuedAt,
      }),
      true,
    );
    assert.equal(
      await signatureMatchesMessage({
        message,
        signature,
        domain: DOMAIN,
        nonce: message.match(/\nNonce: ([^\n]+)/)?.[1] ?? "",
        address: account.address,
        now: new Date(issuedAt.getTime() + 11 * 60 * 1000),
      }),
      false,
    );

    const other = createSiweMessage({
      address: account.address,
      chainId: 143,
      domain: DOMAIN,
      nonce: generateSiweNonce(),
      uri: URI,
      version: "1",
      statement: "Sign something else.",
      issuedAt,
      expirationTime: new Date(issuedAt.getTime() + 60_000),
    });
    const otherSignature = await account.signMessage({ message: other });
    assert.equal(
      await signatureMatchesMessage({
        message: other,
        signature: otherSignature,
        domain: DOMAIN,
        nonce: other.match(/\nNonce: ([^\n]+)/)?.[1] ?? "",
        address: account.address,
        now: issuedAt,
      }),
      false,
    );
  });
});

describe("passport session secret", () => {
  it("accepts an explicit secret and refuses to derive one from the database URL", () => {
    assert.equal(resolveSessionSecret({ explicit: "x".repeat(32), preview: false }), "x".repeat(32));
    assert.equal(resolveSessionSecret({ preview: true }), null);
    assert.throws(
      () => resolveSessionSecret({ databaseUrl: "postgres://user:secret@host/db", preview: false }),
      /CHOG_SESSION_SECRET/,
    );
    assert.throws(
      () => resolveSessionSecret({ explicit: "too-short", databaseUrl: "postgres://db", preview: true }),
      /CHOG_SESSION_SECRET/,
    );
  });
});

describe("passport database", { concurrency: 1 }, () => {
  let sql: Sql;

  before(async () => {
    const pg = new PGlite();
    await pg.waitReady;
    await pg.exec(readFileSync(new URL("../../../migrations/0002_passport.sql", import.meta.url), "utf8"));
    sql = toSql(pg);
  });

  it("saves a profile, rejects a duplicate username, and keeps it after the session is removed", async () => {
    const ada = privateKeyToAccount(generatePrivateKey());
    const bob = privateKeyToAccount(generatePrivateKey());
    const created = await createProfile(sql, ada.address, profile());
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.profile.username, "ada_lane");
    assert.equal(created.profile.walletAddress, ada.address);
    assert.deepEqual(created.profile.skills, ["Research"]);

    const again = await findPublicProfile(sql, "  Ada_Lane ");
    assert.equal(again?.id, created.profile.id);

    const duplicate = await createProfile(sql, bob.address, profile({ username: "ADA_LANE", displayName: "Other" }));
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) assert.equal(duplicate.fieldErrors?.username, "That username is already taken.");

    const secondWallet = await createProfile(sql, ada.address, profile({ username: "ada_other" }));
    assert.equal(secondWallet.ok, false);

    const stolen = await updateProfile(
      sql,
      bob.address,
      profile({ username: "stolen_name", displayName: "Stolen" }),
    );
    assert.equal(stolen.ok, false);
    assert.equal((await findPublicProfile(sql, "ada_lane"))?.displayName, "Ada Lane");
    assert.equal(await findProfileForWallet(sql, bob.address), null);

    const edited = await updateProfile(
      sql,
      ada.address,
      profile({
        displayName: "Ada L.",
        biography: "Updated field notes for the public passport.",
        visibility: "unlisted",
      }),
    );
    assert.equal(edited.ok, true);
    if (!edited.ok) return;
    assert.equal(edited.profile.displayName, "Ada L.");
    assert.equal((await findPublicProfile(sql, "ada_lane"))?.visibility, "unlisted");

    const sessionId = await createPassportSession(sql, ada.address.toLowerCase());
    assert.equal(await readLiveSession(sql, sessionId), ada.address.toLowerCase());
    await deletePassportSession(sql, sessionId);
    assert.equal(await readLiveSession(sql, sessionId), null);
    assert.equal((await findProfileForWallet(sql, ada.address))?.displayName, "Ada L.");
  });

  it("verifies a real signature once and rejects reuse, expiry, tampering, and a bad signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const issued = await issueNonce(sql, {
      address: account.address.toLowerCase(),
      chainId: 143,
      domain: DOMAIN,
      uri: URI,
    });
    assert.ok("message" in issued);
    if (!("message" in issued)) return;
    const signature = await account.signMessage({ message: issued.message });

    const wrongKey = privateKeyToAccount(generatePrivateKey());
    const wrong = await consumeNonce(sql, {
      message: issued.message,
      signature: await wrongKey.signMessage({ message: issued.message }),
      domain: DOMAIN,
    });
    assert.equal(wrong.ok, false);

    const tamperedMessage = issued.message.replace("Choguild", "Elsewhere");
    const tampered = await consumeNonce(sql, {
      message: tamperedMessage,
      signature: await account.signMessage({ message: tamperedMessage }),
      domain: DOMAIN,
    });
    assert.equal(tampered.ok, false);

    const malformed = await consumeNonce(sql, {
      message: issued.message,
      signature: `0x${"11".repeat(65)}` as Hex,
      domain: DOMAIN,
    });
    assert.equal(malformed.ok, false);

    const verified = await consumeNonce(sql, { message: issued.message, signature, domain: DOMAIN });
    assert.equal(verified.ok, true);
    if (verified.ok) assert.equal(verified.address, account.address.toLowerCase());

    const reused = await consumeNonce(sql, { message: issued.message, signature, domain: DOMAIN });
    assert.equal(reused.ok, false);

    const expiredIssue = await issueNonce(sql, {
      address: account.address,
      chainId: 143,
      domain: DOMAIN,
      uri: URI,
    });
    assert.ok("message" in expiredIssue);
    if (!("message" in expiredIssue)) return;
    await sql`update passport_nonces set expires_at = now() - interval '1 minute' where message = ${expiredIssue.message}`;
    const expired = await consumeNonce(sql, {
      message: expiredIssue.message,
      signature: await account.signMessage({ message: expiredIssue.message }),
      domain: DOMAIN,
    });
    assert.equal(expired.ok, false);

    let blocked = false;
    for (let i = 0; i < 9; i += 1) {
      const next = await issueNonce(sql, {
        address: account.address,
        chainId: 143,
        domain: DOMAIN,
        uri: URI,
      });
      if ("error" in next) {
        blocked = true;
        assert.match(next.error, /Too many sign-in challenges/);
        break;
      }
    }
    assert.equal(blocked, true);

    assert.equal(await findPublicProfile(sql, "not-a-real-user"), null);
    assert.equal(await findPublicProfile(sql, "no"), null);
  });
});
