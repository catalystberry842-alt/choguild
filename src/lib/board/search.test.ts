import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBoardSearch } from "./search.ts";

test("skills parse from the router's array form", () => {
  assert.deepEqual(parseBoardSearch({ skills: ["Research", " Design ", ""] }).skills, ["Research", "Design"]);
});

test("skills parse from a comma-separated string", () => {
  assert.deepEqual(parseBoardSearch({ skills: "Research, Design" }).skills, ["Research", "Design"]);
});

test("non-string skill entries are ignored", () => {
  assert.deepEqual(parseBoardSearch({ skills: [1, null, "Research"] }).skills, ["Research"]);
});
