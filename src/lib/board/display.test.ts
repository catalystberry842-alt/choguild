import assert from "node:assert/strict";
import { test } from "node:test";
import { deadlineCountdown, usableImageUrl } from "./display.ts";

test("deadline countdown", () => {
  const now = Date.parse("2026-10-16T12:00:00Z");
  assert.equal(deadlineCountdown(null, now), null);
  assert.equal(deadlineCountdown("2026-10-18T23:59:59Z", now), "3 days left");
  assert.equal(deadlineCountdown("2026-10-16T18:00:00Z", now), "6 hours left");
  assert.equal(deadlineCountdown("2026-10-15T12:00:00Z", now), "Past due");
});

test("usableImageUrl rejects social profile pages", () => {
  assert.equal(usableImageUrl("https://x.com/heistruthx"), null);
  assert.equal(usableImageUrl("https://twitter.com/foo"), null);
  assert.equal(usableImageUrl("https://cdn.example.com/logo.png"), "https://cdn.example.com/logo.png");
  assert.equal(usableImageUrl("/api/avatar/83bfa82f-f8be-4f15-9f80-d3a09f390756"), "/api/avatar/83bfa82f-f8be-4f15-9f80-d3a09f390756");
  assert.equal(usableImageUrl(null), null);
});
