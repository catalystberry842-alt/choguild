import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chogSnapshot, holdingFrom, isChogHolderNow, ownsChogNow } from "./holders.server.ts";
import { chogBonusFor } from "./chog.ts";
import { chogAvatarError } from "./avatar-check.ts";

// Real Monad RPC reads against Chog Genesis. Opt in with CHOG_LIVE=1.
const HOLDER = "0x3D38FeE3E1a4c43d8fcF715aA6C9ff025074E7E0"; // owner of token #1 (21 Oct 2026)
const NON_HOLDER = "0x000000000000000000000000000000000000dEaD";

describe("Chog Genesis live onchain checks", { skip: process.env.CHOG_LIVE !== "1" }, () => {
  it("balanceOf detects holder and non-holder", async () => {
    assert.equal(await isChogHolderNow(HOLDER), true);
    assert.equal(await isChogHolderNow(NON_HOLDER), false);
  });
  it("ownerOf backs the Use my Chog check", async () => {
    assert.equal(await ownsChogNow(HOLDER, 1), true);
    assert.equal(await ownsChogNow(NON_HOLDER, 1), false);
    const never = async () => null;
    assert.equal(await chogAvatarError(HOLDER, "/api/chog/1", ownsChogNow, never), null);
    assert.match((await chogAvatarError(NON_HOLDER, "/api/chog/1", ownsChogNow, never))!, /not held/);
    assert.match((await chogAvatarError(HOLDER, "/api/chog/2", ownsChogNow, never))!, /not held/);
  });
  it("snapshot (passport badge + XP boost source) sees the holder", async () => {
    const snap = await chogSnapshot();
    assert.ok(snap && snap.owners.size > 100);
    const h = holdingFrom(snap, HOLDER)!;
    assert.ok(h.count >= 1 && h.tokenIds.includes(1));
    assert.equal(holdingFrom(snap, NON_HOLDER)!.count, 0);
    assert.equal(chogBonusFor(135, h.count > 0), 14);
    assert.equal(chogBonusFor(900, h.count > 0), 50);
    assert.equal(chogBonusFor(135, false), 0);
  });
});
