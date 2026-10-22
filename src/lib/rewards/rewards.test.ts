import assert from "node:assert/strict";
import { test } from "node:test";
import { formatChog, matchTransfer, rewardWei, TRANSFER_TOPIC } from "./rewards.ts";
import { validateOpportunity } from "../board/validate.ts";

const TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";
const from = "0x1111111111111111111111111111111111111111";
const to = "0x2222222222222222222222222222222222222222";
const pad = (a: string) => `0x${"0".repeat(24)}${a.slice(2)}`;
const log = (o: Partial<{ address: string; f: string; t: string; amount: bigint; topic: string }> = {}) => ({
  address: o.address ?? TOKEN,
  topics: [o.topic ?? TRANSFER_TOPIC, pad(o.f ?? from), pad(o.t ?? to)],
  data: `0x${(o.amount ?? rewardWei("500")).toString(16).padStart(64, "0")}`,
});

test("matches only a $CHOG Transfer from the publisher to the holder for at least the reward", () => {
  const min = rewardWei("500");
  assert.equal(matchTransfer([log()], { from, to, minWei: min }), min);
  assert.equal(matchTransfer([log({ amount: min - 1n })], { from, to, minWei: min }), null);
  assert.equal(matchTransfer([log({ address: "0x0000000000000000000000000000000000000001" })], { from, to, minWei: min }), null);
  assert.equal(matchTransfer([log({ t: from })], { from, to, minWei: min }), null);
  assert.equal(matchTransfer([log({ f: to })], { from, to, minWei: min }), null);
  assert.equal(matchTransfer([log({ topic: "0x" + "ab".repeat(32) })], { from, to, minWei: min }), null);
  assert.equal(matchTransfer([log({ amount: 1n }), log({ amount: min * 2n })], { from: from.toUpperCase().replace("0X", "0x"), to, minWei: min }), min * 2n);
});

test("formats wei as $CHOG", () => {
  assert.equal(formatChog(rewardWei("1234.5")), "1,234.5");
  assert.equal(formatChog(rewardWei("500")), "500");
});

test("listing reward validates", () => {
  const base = {
    projectName: "Field Desk", projectLogoUrl: "", title: "Write the onboarding note", summary: "A real summary that is long enough to publish on the board.",
    description: "A full description of the work that a contributor would actually read before applying.", scope: "One note, one review, and a clear stop.", deliverables: "A markdown note of about 600 words.",
    requiredSkills: ["Content writing"], preferredSkills: [], category: "content", compensationType: "token", compensationDetails: "500 $CHOG on acceptance",
    timeCommitment: "", deadline: "", instructions: "Send the note.", question: "", positions: "", publish: true,
  };
  const ok = validateOpportunity({ ...base, rewardChog: "500" });
  assert.ok(ok.ok && ok.value.rewardChog === "500");
  const none = validateOpportunity(base);
  assert.ok(none.ok && none.value.rewardChog === null);
  for (const bad of ["0", "-5", "abc", "1.23456"]) assert.equal(validateOpportunity({ ...base, rewardChog: bad }).ok, false, bad);
});
