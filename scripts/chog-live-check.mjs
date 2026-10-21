// Live onchain verification of Chog Genesis perks against Monad mainnet RPC.
// Usage: node scripts/chog-live-check.mjs [baseUrl]
import { createPublicClient, http, parseAbi } from "viem";
const CHOG = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763";
const abi = parseAbi(["function ownerOf(uint256) view returns (address)","function balanceOf(address) view returns (uint256)","function name() view returns (string)","function totalSupply() view returns (uint256)"]);
const c = createPublicClient({ transport: http(process.env.MONAD_RPC ?? "https://rpc.monad.xyz") });
const base = process.argv[2] ?? "https://choguild.vercel.app";
const name = await c.readContract({ address: CHOG, abi, functionName: "name" });
const supply = await c.readContract({ address: CHOG, abi, functionName: "totalSupply" });
const holder = await c.readContract({ address: CHOG, abi, functionName: "ownerOf", args: [1n] });
const nonHolder = "0x000000000000000000000000000000000000dEaD";
const hb = await c.readContract({ address: CHOG, abi, functionName: "balanceOf", args: [holder] });
const nb = await c.readContract({ address: CHOG, abi, functionName: "balanceOf", args: [nonHolder] });
const owner2 = await c.readContract({ address: CHOG, abi, functionName: "ownerOf", args: [2n] });
console.log(JSON.stringify({ name, supply: String(supply), holder, holderBalance: String(hb), nonHolder, nonHolderBalance: String(nb), token2Owner: owner2, holderOwnsToken2: owner2.toLowerCase() === holder.toLowerCase() }, null, 1));
for (const id of [1, 0, 99999]) {
  const r = await fetch(`${base}/api/chog/${id}`);
  console.log(`/api/chog/${id}`, r.status, r.headers.get("content-type"), r.headers.get("cache-control"));
}
