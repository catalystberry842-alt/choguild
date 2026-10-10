import { verifyMessage, type Hex } from "viem";
import { createSiweMessage, parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { SIWE_STATEMENT } from "@/lib/passport/copy";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function buildPassportMessage(input: {
  address: `0x${string}`;
  chainId: number;
  domain: string;
  uri: string;
  nonce: string;
  issuedAt: Date;
}): { message: string; expiresAt: Date } {
  const expiresAt = new Date(input.issuedAt.getTime() + TEN_MINUTES_MS);
  const message = createSiweMessage({
    address: input.address,
    chainId: input.chainId,
    domain: input.domain,
    nonce: input.nonce,
    uri: input.uri,
    version: "1",
    statement: SIWE_STATEMENT,
    issuedAt: input.issuedAt,
    expirationTime: expiresAt,
  });
  return { message, expiresAt };
}

export async function signatureMatchesMessage(input: {
  message: string;
  signature: Hex;
  domain: string;
  nonce: string;
  address: `0x${string}`;
  now?: Date;
}): Promise<boolean> {
  const parsed = parseSiweMessage(input.message);
  const fieldsOk = validateSiweMessage({
    message: parsed,
    address: input.address,
    domain: input.domain,
    nonce: input.nonce,
    time: input.now ?? new Date(),
  });
  if (!fieldsOk || parsed.statement !== SIWE_STATEMENT || !parsed.address) return false;
  return verifyMessage({
    address: parsed.address,
    message: input.message,
    signature: input.signature,
  });
}
