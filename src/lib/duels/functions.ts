import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "@/lib/schemas";
import { MOVE_IDS, ROUNDS, type MoveId } from "./duels";

const chogIdSchema = z.coerce.number().int().min(1).max(1969);

export const getDuelBoard = createServerFn({ method: "GET" })
  .validator((id: unknown) => S.parseInput(chogIdSchema, id))
  .handler(async ({ data }) => {
    const { resolveViewer } = await import("@/lib/chog/actor.server");
    const { duelHistory, duelsLeftToday } = await import("./repo.server");
    const viewer = await resolveViewer();
    const history = await duelHistory(viewer.sql, data);
    return {
      history,
      viewerChogId: viewer.chogId,
      left: viewer.wallet && viewer.chogId ? await duelsLeftToday(viewer.sql, viewer.wallet) : null,
    };
  });

export const getDuelResult = createServerFn({ method: "GET" })
  .validator((id: unknown) => S.parseInput(z.string().regex(/^[0-9a-f]{16}$/), id))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const { getDuel } = await import("./repo.server");
    return getDuel(await getSql(), data);
  });

export const startDuel = createServerFn({ method: "POST" })
  .validator((input: { defenderId: number; picks: MoveId[] }) =>
    S.parseInput(z.object({ defenderId: chogIdSchema, picks: z.array(z.enum(MOVE_IDS as [MoveId, ...MoveId[]])).length(ROUNDS) }), input),
  )
  .handler(async ({ data }) => {
    const { assertSameOrigin, requesterKey } = await import("@/lib/passport/origin.server");
    assertSameOrigin();
    const { takeToken } = await import("@/lib/rate-limit");
    if (!takeToken(`duel:${requesterKey()}`, 10, 60_000)) return { ok: false as const, error: "Slow down a little." };
    const { resolveViewer, liveOwnerOf } = await import("@/lib/chog/actor.server");
    const { createDuel } = await import("./repo.server");
    const { loadRanking } = await import("@/lib/ranking/functions");
    const { totalXp, tierFor, TIERS } = await import("@/lib/ranking/xp");
    let viewer;
    try {
      viewer = await resolveViewer({ fresh: true });
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Ownership check failed." };
    }
    if (!viewer.wallet || !viewer.chogId) return { ok: false as const, error: "Act as a Chog you own to duel." };
    if (viewer.chogId === data.defenderId) return { ok: false as const, error: "A Chog can't duel itself." };
    let defenderWallet: string | null;
    try {
      defenderWallet = await liveOwnerOf(data.defenderId, { fresh: true });
    } catch {
      return { ok: false as const, error: "Monad RPC is unreachable. Try again in a moment." };
    }
    if (!defenderWallet) return { ok: false as const, error: "That Chog isn't held by anyone." };
    const ranking = await loadRanking();
    const level = (id: number) => {
      const p = ranking.contributors.find((c) => c.chogId === id);
      return TIERS.findIndex((t) => t.name === tierFor(p ? totalXp(p) : 0).tier.name);
    };
    return createDuel(viewer.sql, {
      challengerId: viewer.chogId,
      defenderId: data.defenderId,
      wallet: viewer.wallet,
      defenderWallet,
      picks: data.picks,
      challengerLevel: level(viewer.chogId),
      defenderLevel: level(data.defenderId),
    });
  });
