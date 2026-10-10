import { createServerFn } from "@tanstack/react-start";

export const getMonadStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { probeMonadRpc } = await import("./status.server");
  const env = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_MONAD_RPC_URL as string | undefined) : undefined;
  return probeMonadRpc(env);
});
