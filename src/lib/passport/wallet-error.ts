export function walletErrorMessage(error: unknown, action: "connect" | "sign" | "switch"): string {
  const record = typeof error === "object" && error ? (error as { code?: number; name?: string; message?: string }) : {};
  const message = record.message ?? (error instanceof Error ? error.message : "");
  const rejected =
    record.code === 4001 ||
    record.name === "UserRejectedRequestError" ||
    /user rejected|rejected the request/i.test(message);
  if (rejected) {
    if (action === "sign") return "Signature cancelled. You're not signed in.";
    if (action === "switch") return "Network switch cancelled. Your wallet is still on its current network.";
    return "Connection cancelled. No wallet was connected.";
  }
  if (/provider not found|no provider|ethereum is not defined|could not find connector/i.test(message)) {
    return "No wallet found in this browser. Install one such as MetaMask or Rabby, then try again.";
  }
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    if (action === "sign") return "The signature didn't go through. Try again.";
    if (action === "switch") return "Couldn't switch to Monad. Try again from your wallet.";
    return "The wallet didn't connect. Try again.";
  }
  return cleaned.slice(0, 180);
}
