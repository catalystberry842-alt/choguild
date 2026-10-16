import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { parseInput } from "@/lib/schemas";

const walletSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid address");

/** Chog Genesis holdings for one wallet, from the cached onchain snapshot. Null when the chain is unreachable. */
export const getChogHolding = createServerFn({ method: "GET" })
  .validator((wallet: unknown) => parseInput(walletSchema, wallet))
  .handler(async ({ data }) => {
    const { chogSnapshot, holdingFrom } = await import("./holders.server");
    return holdingFrom(await chogSnapshot({ budgetMs: 2_500 }), data);
  });
