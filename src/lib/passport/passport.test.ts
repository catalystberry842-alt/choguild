import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { resolveSessionSecret } from "@/lib/passport/session-secret";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import type { Hex } from "viem";
import { completionSummary, profileCompletion } from "./completion.ts";
import { checkAvatarSource, checkAvatarUpload, parseAvatarRef, sniffImageType, squareCrop, AVATAR_MAX_BYTES } from "./avatar.ts";
import { readAvatar, storeAvatar } from "./avatar.server.ts";
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
      [{ avatarUrl: "/api/avatar/not-a-uuid" }, "avatarUrl"],
      [{ avatarUrl: "/api/chog/99999" }, "avatarUrl"],
      [{ avatarUrl: "javascript:alert(1)" }, "avatarUrl"],
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
  it("counts four profile details and is not a score", () => {
    const empty = profileCompletion({
      biography: "Short",
      skills: [],
      githubUrl: null,
      xUrl: null,
      otherLinks: [],
      avatarUrl: null,
    });
    assert.equal(empty.length, 4);
    assert.equal(completionSummary(empty), "0 of 4 profile details");

    const full = profileCompletion({
      biography: "This biography is long enough to count as a profile detail.",
      skills: ["Design"],
      githubUrl: null,
      xUrl: null,
      otherLinks: [{ url: "https://example.com/other" }],
      avatarUrl: "https://example.com/a.png",
    });
    assert.equal(completionSummary(full), "4 of 4 profile details");
    assert.ok(full.every((item) => item.done));
  });
});

describe("avatar rules", () => {
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const gif = new TextEncoder().encode("GIF89a....");

  it("sniffs image bytes instead of trusting the declared type", () => {
    assert.equal(sniffImageType(webp), "image/webp");
    assert.equal(sniffImageType(jpeg), "image/jpeg");
    assert.equal(sniffImageType(png), "image/png");
    assert.equal(sniffImageType(gif), "image/gif");
    assert.equal(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>")), null);
  });

  it("accepts compressed WebP/JPEG/PNG uploads and rejects empty, oversized, GIF and non-image bodies", () => {
    assert.deepEqual(checkAvatarUpload(webp), { ok: true, type: "image/webp" });
    assert.deepEqual(checkAvatarUpload(jpeg), { ok: true, type: "image/jpeg" });
    assert.equal(checkAvatarUpload(new Uint8Array()).ok, false);
    assert.equal(checkAvatarUpload(gif).ok, false);
    const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
    big.set(jpeg);
    const tooBig = checkAvatarUpload(big);
    assert.equal(tooBig.ok, false);
    if (!tooBig.ok) assert.equal(tooBig.status, 413);
    const svg = checkAvatarUpload(new TextEncoder().encode("<svg/>"));
    if (!svg.ok) assert.equal(svg.status, 415);
  });

  it("checks picked files and parses stored avatar values", () => {
    assert.equal(checkAvatarSource({ type: "image/gif", size: 1000 }), null);
    assert.equal(checkAvatarSource({ type: "", size: 1000, name: "me.JPG" }), null);
    assert.match(checkAvatarSource({ type: "image/svg+xml", size: 1000 }) ?? "", /PNG, JPG, WebP or GIF/);
    assert.match(checkAvatarSource({ type: "image/png", size: 11 * 1024 * 1024 }) ?? "", /10 MB/);
    assert.deepEqual(parseAvatarRef(""), { kind: "none" });
    assert.equal(parseAvatarRef("/api/avatar/3b241101-e2bb-4255-8caf-4136c566a962").kind, "upload");
    assert.deepEqual(parseAvatarRef("/api/chog/42"), { kind: "chog", tokenId: 42 });
    assert.equal(parseAvatarRef("https://example.com/a.png").kind, "external");
    assert.equal(parseAvatarRef("http://example.com/a.png").kind, "invalid");
    assert.deepEqual(squareCrop(1200, 800), { sx: 200, sy: 0, side: 800, out: 512 });
    assert.deepEqual(squareCrop(300, 400), { sx: 0, sy: 50, side: 300, out: 300 });
  });
});

describe("wallet errors", () => {
  it("explains rejection and a missing provider", () => {
    assert.match(walletErrorMessage({ code: 4001, message: "no" }, "connect"), /rejected the connection/);
    assert.match(
      walletErrorMessage({ name: "UserRejectedRequestError", message: "User rejected the request." }, "sign"),
      /rejected the signature/,
    );
    assert.match(walletErrorMessage(new Error("Provider not found"), "connect"), /No wallet provider/);
    assert.match(walletErrorMessage(new Error(""), "switch"), /could not switch/);
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
    for (const file of ["0003_board.sql", "0004_work.sql", "0005_indexes.sql", "0006_remove_demo_data.sql", "0007_chog_gate.sql", "0008_audit_v15.sql", "0009_avatars.sql", "0010_chog_is_member.sql"]) {
      await pg.exec(readFileSync(new URL(`../../../migrations/${file}`, import.meta.url), "utf8"));
    }
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

  it("stores uploaded avatars per wallet, blocks other wallets' uploads, and keeps legacy URLs", async () => {
    const cleo = privateKeyToAccount(generatePrivateKey());
    const dan = privateKeyToAccount(generatePrivateKey());
    const cleoWallet = cleo.address.toLowerCase();
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const first = await storeAvatar(sql, cleoWallet, bytes, "image/jpeg");
    const read = await readAvatar(sql, first.id);
    assert.equal(read?.type, "image/jpeg");
    assert.deepEqual(Array.from(read?.bytes ?? []), Array.from(bytes));

    const external = await createProfile(sql, cleo.address, profile({ username: "cleo_ext", avatarUrl: "https://example.com/c.png" }));
    assert.equal(external.ok, false);
    if (!external.ok) assert.ok(external.fieldErrors?.avatarUrl);

    const created = await createProfile(sql, cleo.address, profile({ username: "cleo_av", avatarUrl: first.url }));
    assert.equal(created.ok, true);
    if (created.ok) assert.equal(created.profile.avatarUrl, first.url);

    const theft = await createProfile(sql, dan.address, profile({ username: "dan_av", avatarUrl: first.url }));
    assert.equal(theft.ok, false);
    if (!theft.ok) assert.ok(theft.fieldErrors?.avatarUrl);

    // A new upload prunes unsaved ones but keeps the one the passport points at.
    const draft = await storeAvatar(sql, cleoWallet, bytes, "image/jpeg");
    const replacement = await storeAvatar(sql, cleoWallet, bytes, "image/jpeg");
    assert.equal(await readAvatar(sql, draft.id), null);
    assert.ok(await readAvatar(sql, first.id));
    const swapped = await updateProfile(sql, cleo.address, profile({ username: "cleo_av", avatarUrl: replacement.url }));
    assert.equal(swapped.ok, true);

    // Legacy https avatars already on a passport keep working on later edits.
    await sql`update contributor_profiles set avatar_url = 'https://example.com/old.png' where wallet_address = ${cleoWallet}`;
    const legacy = await updateProfile(sql, cleo.address, profile({ username: "cleo_av", avatarUrl: "https://example.com/old.png", displayName: "Cleo" }));
    assert.equal(legacy.ok, true);
    if (legacy.ok) assert.equal(legacy.profile.avatarUrl, "https://example.com/old.png");
    const swappedExternal = await updateProfile(sql, cleo.address, profile({ username: "cleo_av", avatarUrl: "https://example.com/new.png" }));
    assert.equal(swappedExternal.ok, false);
    const cleared = await updateProfile(sql, cleo.address, profile({ username: "cleo_av", avatarUrl: "" }));
    assert.equal(cleared.ok, true);
    if (cleared.ok) assert.equal(cleared.profile.avatarUrl, null);
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

    // An attacker spamming challenges for this wallet from their own IP gets limited,
    // and the real owner (different requester) can still get a fresh challenge.
    let attackerBlocked = false;
    for (let i = 0; i < 40; i += 1) {
      const spam = await issueNonce(sql, { address: account.address, chainId: 143, domain: DOMAIN, uri: URI, requester: "attacker" });
      if ("error" in spam) {
        attackerBlocked = true;
        assert.match(spam.error, /Too many sign-in requests/);
        break;
      }
    }
    assert.equal(attackerBlocked, true);
    const open = await sql<{ count: number }>`select count(*)::int as count from passport_nonces where address = ${account.address.toLowerCase()} and used_at is null and expires_at > now()`;
    assert.ok(Number(open[0].count) <= 3);
    const owner = await issueNonce(sql, { address: account.address, chainId: 143, domain: DOMAIN, uri: URI, requester: "owner" });
    assert.ok("message" in owner);
    if (!("message" in owner)) return;
    const signed = await consumeNonce(sql, { message: owner.message, signature: await account.signMessage({ message: owner.message }), domain: DOMAIN });
    assert.equal(signed.ok, true, JSON.stringify(signed));

    assert.equal(await findPublicProfile(sql, "not-a-real-user"), null);
    assert.equal(await findPublicProfile(sql, "no"), null);
  });
});
