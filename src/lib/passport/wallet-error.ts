export function walletErrorMessage(error: unknown, action: "connect" | "sign" | "switch"): string {
  const record = typeof error === "object" && error ? (error as { code?: number; name?: string; message?: string }) : {};
  const message = record.message ?? (error instanceof Error ? error.message : "");
  const rejected =
    record.code === 4001 ||
    record.name === "UserRejectedRequestError" ||
    /user rejected|rejected the request/i.test(message);
  if (rejected) {
    if (action === "sign") return "You rejected the signature. Your passport session was not opened.";
    if (action === "switch") return "You rejected the network switch. The wallet is still on its current network.";
    return "You rejected the connection request. No wallet was connected.";
  }
  if (/provider not found|no provider|ethereum is not defined|could not find connector/i.test(message)) {
    return "No wallet provider was found in this browser. Install a wallet that exposes an Ethereum provider, then try again.";
  }
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    if (action === "sign") return "The signature could not be completed.";
    if (action === "switch") return "The wallet could not switch to Monad.";
    return "The wallet could not connect.";
  }
  return cleaned.slice(0, 180);
}
