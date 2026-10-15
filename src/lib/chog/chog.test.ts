import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHOG_BOOST_CAP, chogBonusFor, imagePathFromTokenUri, isChogTokenId } from "./chog.ts";

describe("Chog holder perks", () => {
  it("adds 10% of guild XP for holders, rounded and capped", () => {
    assert.equal(chogBonusFor(135, true), 14);
    assert.equal(chogBonusFor(135, false), 0);
    assert.equal(chogBonusFor(0, true), 0);
    assert.equal(chogBonusFor(-5, true), 0);
    assert.equal(chogBonusFor(10_000, true), CHOG_BOOST_CAP);
  });
  it("validates token ids to the 1..1969 supply", () => {
    assert.equal(isChogTokenId(1), true);
    assert.equal(isChogTokenId(1969), true);
    assert.equal(isChogTokenId(0), false);
    assert.equal(isChogTokenId(1970), false);
    assert.equal(isChogTokenId(1.5), false);
    assert.equal(isChogTokenId("1"), false);
  });
  it("maps tokenURI metadata to the image path", () => {
    assert.equal(
      imagePathFromTokenUri("ipfs://bafybeid4ybujnscdipkno7ps5utqelp5ry5ryreqhay3zhgk3a6x4jruqu/1462.json"),
      "bafybeihau2egcccbdxymeckmmbrqytbfor5gkt3en6d5fsbueymdbq7g6e/1462.webp",
    );
    assert.equal(imagePathFromTokenUri("https://evil.example/1.json"), null);
    assert.equal(imagePathFromTokenUri("ipfs://cid/../x.json"), null);
  });
});
