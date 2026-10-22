/** $CHOG listing rewards: pure helpers for verifying the publisher's ERC-20 transfer onchain. */
import { parseUnits } from "viem";
import { CHOG_TOKEN, CHOG_TOKEN_DECIMALS } from "@/lib/chog/chog";

/** keccak256("Transfer(address,address,uint256)") */
export const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export type ReceiptLog = { address: string; topics: readonly string[]; data: string };

export function rewardWei(amount: string): bigint {
  return parseUnits(amount, CHOG_TOKEN_DECIMALS);
}

const topicAddress = (topic: string | undefined) => (topic ? `0x${topic.slice(-40)}`.toLowerCase() : "");

/** Finds a $CHOG Transfer(from -> to) of at least `minWei` in a receipt's logs. Returns the amount or null. */
export function matchTransfer(logs: readonly ReceiptLog[], expect: { from: string; to: string; minWei: bigint; token?: string }): bigint | null {
  const token = (expect.token ?? CHOG_TOKEN).toLowerCase();
  for (const log of logs) {
    if (log.address.toLowerCase() !== token) continue;
    if (log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC || log.topics.length !== 3) continue;
    if (topicAddress(log.topics[1]) !== expect.from.toLowerCase() || topicAddress(log.topics[2]) !== expect.to.toLowerCase()) continue;
    let amount: bigint;
    try {
      amount = BigInt(log.data);
    } catch {
      continue;
    }
    if (amount >= expect.minWei) return amount;
  }
  return null;
}

export function formatChog(wei: bigint | string): string {
  const v = typeof wei === "string" ? BigInt(wei) : wei;
  const whole = v / 10n ** 18n;
  const frac = Number((v % 10n ** 18n) / 10n ** 14n);
  return `${whole.toLocaleString("en-US")}${frac ? `.${String(frac).padStart(4, "0").replace(/0+$/, "")}` : ""}`;
}
