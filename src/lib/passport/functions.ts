import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "@/lib/schemas";
import type { Hex } from "viem";
import type { ProfileInput } from "@/lib/passport/validate";

export const getPassportState = createServerFn({ method: "GET" }).handler(async () => {
  const { loadPassportState } = await import("./state.server");
  return loadPassportState();
});

export const getPublicProfile = createServerFn({ method: "GET" })
  .validator((username: unknown) => S.parseInput(S.usernameSchema, username))
  .handler(async ({ data }) => {
    const { loadPublicProfile } = await import("./state.server");
    return loadPublicProfile(data);
  });

export const requestNonce = createServerFn({ method: "POST" })
  .validator((input: { address: string; chainId: number }) => S.parseInput(S.nonceSchema, input))
  .handler(async ({ data }) => {
    const { beginNonce } = await import("./state.server");
    return beginNonce(data);
  });

export const verifySignature = createServerFn({ method: "POST" })
  .validator(
    (input: { message: string; signature: Hex }) =>
    S.parseInput(S.verifySchema, input) as { message: string; signature: Hex }
  )
  .handler(async ({ data }) => {
    const { finishSignature } = await import("./state.server");
    return finishSignature(data);
  });

export const endPassportSession = createServerFn({ method: "POST" }).handler(async () => {
  const { finishEndSession } = await import("./state.server");
  return finishEndSession();
});

export const saveProfile = createServerFn({ method: "POST" })
  .validator(
    (input: { mode: "create" | "update"; profile: ProfileInput }) =>
    S.parseInput(z.object({ mode: z.enum(["create", "update"]), profile: S.profileSchema }), input)
  )
  .handler(async ({ data }) => {
    const { finishSave } = await import("./state.server");
    return finishSave(data);
  });

export const setActingChog = createServerFn({ method: "POST" })
  .validator((input: { chogId: number | null }) => S.parseInput(z.object({ chogId: z.number().int().min(1).max(10_000).nullable() }), input))
  .handler(async ({ data }) => {
    const { chooseChog } = await import("./state.server");
    return chooseChog(data.chogId);
  });
