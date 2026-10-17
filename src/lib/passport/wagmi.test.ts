import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedConnector } from "./wagmi.ts";

test("allows MetaMask, Rabby, and generic injected", () => {
  assert.equal(isAllowedConnector({ id: "io.metamask", name: "MetaMask", type: "injected" }), true);
  assert.equal(isAllowedConnector({ id: "io.rabby", name: "Rabby Wallet", type: "injected" }), true);
  assert.equal(isAllowedConnector({ id: "injected", name: "Injected", type: "injected" }), true);
});

test("hides Phantom by name, id, and app.phantom rdns", () => {
  assert.equal(isAllowedConnector({ id: "app.phantom", name: "Phantom", type: "injected" }), false);
  assert.equal(isAllowedConnector({ id: "phantom", name: "Browser Wallet", type: "injected" }), false);
  assert.equal(isAllowedConnector({ id: "xyz", name: "Phantom", type: "injected" }), false);
  assert.equal(
    isAllowedConnector({ id: "injected", name: "Injected", type: "injected", rdns: "app.phantom" }),
    false,
  );
});

test("hides Coinbase and WalletConnect", () => {
  assert.equal(isAllowedConnector({ id: "coinbaseWalletSDK", name: "Coinbase Wallet", type: "coinbaseWallet" }), false);
  assert.equal(isAllowedConnector({ id: "walletConnect", name: "WalletConnect", type: "walletConnect" }), false);
});

test("hides Phantom when rdns is a string array", () => {
  assert.equal(
    isAllowedConnector({ id: "injected", name: "Injected", type: "injected", rdns: ["app.phantom"] }),
    false,
  );
});

