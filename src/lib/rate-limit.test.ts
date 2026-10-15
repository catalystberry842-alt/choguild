import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resetRateLimits, takeToken } from "./rate-limit.ts";

describe("rate limiter", () => {
  it("allows up to the limit, then blocks until the window passes", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) assert.equal(takeToken("k", 3, 1000, 0), true);
    assert.equal(takeToken("k", 3, 1000, 10), false);
    assert.equal(takeToken("other", 3, 1000, 10), true);
    assert.equal(takeToken("k", 3, 1000, 1001), true);
  });
});
