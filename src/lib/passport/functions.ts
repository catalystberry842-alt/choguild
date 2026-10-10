import { createServerFn } from "@tanstack/react-start";
import type { Hex } from "viem";
import type { ProfileInput } from "@/lib/passport/validate";

export const getPassportState = createServerFn({ method: "GET" }).handler(async () => {
  const { loadPassportState } = await import("./state.server");
  return loadPassportState();
});

export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((username: string) => username)
  .handler(async ({ data }) => {
    const { loadPublicProfile } = await import("./state.server");
    return loadPublicProfile(data);
  });

export const requestNonce = createServerFn({ method: "POST" })
  .validator((input: { address: string; chainId: number }) => input)
  .handler(async ({ data }) => {
    const { beginNonce } = await import("./state.server");
    return beginNonce(data);
  });

export const verifySignature = createServerFn({ method: "POST" })
  .validator((input: { message: string; signature: Hex }) => input)
  .handler(async ({ data }) => {
    const { finishSignature } = await import("./state.server");
    return finishSignature(data);
  });

export const endPassportSession = createServerFn({ method: "POST" }).handler(async () => {
  const { finishEndSession } = await import("./state.server");
  return finishEndSession();
});

export const saveProfile = createServerFn({ method: "POST" })
  .validator((input: { mode: "create" | "update"; profile: ProfileInput }) => input)
  .handler(async ({ data }) => {
    const { finishSave } = await import("./state.server");
    return finishSave(data);
  });
