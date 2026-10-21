import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chogAvatarError } from "./avatar-check.ts";

const W = "0x3D38FeE3E1a4c43d8fcF715aA6C9ff025074E7E0";
const never = async () => { throw new Error("not called"); };

describe("Use my Chog avatar ownership", () => {
  it("ignores non-Chog avatars", async () => {
    assert.equal(await chogAvatarError(W, "", never, never), null);
    assert.equal(await chogAvatarError(W, "https://example.com/a.png", never, never), null);
  });
  it("accepts an owned token and rejects someone else's", async () => {
    assert.equal(await chogAvatarError(W, "/api/chog/1", async (_w, id) => id === 1, never), null);
    assert.match((await chogAvatarError(W, "/api/chog/2", async (_w, id) => id === 1, never))!, /not held/);
  });
  it("falls back to the snapshot when the RPC is down", async () => {
    const down = async () => null;
    assert.match((await chogAvatarError(W, "/api/chog/13", down, async () => false))!, /not held/);
    assert.equal(await chogAvatarError(W, "/api/chog/13", down, async () => true), null);
    assert.equal(await chogAvatarError(W, "/api/chog/13", down, async () => null), null);
  });
});
