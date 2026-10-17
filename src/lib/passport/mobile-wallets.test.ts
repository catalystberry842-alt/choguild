import assert from "node:assert/strict";
import { test } from "node:test";
import { isMobileUserAgent, walletDeepLinks } from "./mobile-wallets.ts";

test("detects phones and iPadOS, not desktops", () => {
  assert.equal(isMobileUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"), true);
  assert.equal(isMobileUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36"), true);
  assert.equal(isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", 5), true);
  assert.equal(isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15", 0), false);
  assert.equal(isMobileUserAgent("Mozilla/5.0 (X11; Linux x86_64) Chrome/130"), false);
});

test("deep links carry the current page and never offer Phantom", () => {
  const links = walletDeepLinks("https://choguild.vercel.app/passport?x=1");
  const byId = Object.fromEntries(links.map((link) => [link.id, link.href]));
  assert.equal(byId.metamask, "https://metamask.app.link/dapp/choguild.vercel.app/passport?x=1");
  assert.equal(byId.phantom, undefined);
  assert.equal(links.some((link) => /phantom/i.test(link.id) || /phantom/i.test(link.name)), false);
  assert.match(byId.trust!, /^https:\/\/link\.trustwallet\.com\/open_url\?coin_id=60&url=https%3A%2F%2Fchoguild/);
  assert.equal(byId.rabby, null);
  assert.equal(byId.rainbow, null);
});
