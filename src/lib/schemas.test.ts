import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { idSchema, nonceSchema, opportunityStatusSchema, parseInput, reviewApplicationSchema, reviewWorkSchema, verifySchema } from "./schemas.ts";

describe("server function boundary schemas", () => {
  it("accepts well-formed ids and rejects junk", () => {
    assert.equal(parseInput(idSchema, "3f2a-9c1b"), "3f2a-9c1b");
    assert.throws(() => parseInput(idSchema, ""), /Invalid request/);
    assert.throws(() => parseInput(idSchema, "a'; drop table x"));
    assert.throws(() => parseInput(idSchema, { id: 1 }));
  });
  it("only allows known opportunity statuses", () => {
    assert.equal(parseInput(opportunityStatusSchema, { id: "abc", status: "filled" }).status, "filled");
    assert.throws(() => parseInput(opportunityStatusSchema, { id: "abc", status: "deleted" }), /status/);
  });
  it("only allows known review statuses and actions", () => {
    assert.throws(() => parseInput(reviewApplicationSchema, { id: "a", status: "hacked", feedback: "" }));
    assert.equal(parseInput(reviewApplicationSchema, { id: "a", status: "shortlisted", feedback: "ok" }).status, "shortlisted");
    assert.throws(() => parseInput(reviewWorkSchema, { id: "a", action: "draft", comment: "", privateNote: "" }));
  });
  it("validates wallet inputs", () => {
    assert.throws(() => parseInput(nonceSchema, { address: "0x123", chainId: 143 }), /address/);
    assert.equal(parseInput(nonceSchema, { address: `0x${"a".repeat(40)}`, chainId: 143 }).chainId, 143);
    assert.throws(() => parseInput(verifySchema, { message: "hi", signature: "nothex" }));
  });
  it("caps oversized payloads", () => {
    assert.throws(() => parseInput(reviewApplicationSchema, { id: "a", status: "accepted", feedback: "x".repeat(6000) }));
  });
});
