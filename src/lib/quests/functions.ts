import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "@/lib/schemas";
import { QUEST_IDS, type QuestId } from "./quests";

export const getQuestBoard = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveViewer } = await import("@/lib/chog/actor.server");
  const { questBoard } = await import("./repo.server");
  const viewer = await resolveViewer();
  if (!viewer.wallet || !viewer.chogId) return null;
  return { chogId: viewer.chogId, ...(await questBoard(viewer.sql, viewer.chogId, viewer.wallet)) };
});

export const doQuest = createServerFn({ method: "POST" })
  .validator((input: { quest: QuestId; target?: string | null }) =>
    S.parseInput(z.object({ quest: z.enum(QUEST_IDS as [QuestId, ...QuestId[]]), target: z.string().max(80).nullish() }), input),
  )
  .handler(async ({ data }) => {
    const { assertSameOrigin } = await import("@/lib/passport/origin.server");
    assertSameOrigin();
    const { resolveViewer, liveOwnerOf } = await import("@/lib/chog/actor.server");
    const { completeQuest } = await import("./repo.server");
    let viewer;
    try {
      viewer = await resolveViewer({ fresh: true });
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Ownership check failed." };
    }
    if (!viewer.wallet || !viewer.chogId || !viewer.actor) return { ok: false as const, error: "Act as a Chog you own to do quests." };
    if (data.quest === "scout") {
      const rows = await viewer.sql<{ owner_wallet: string }>`select owner_wallet from opportunities where id = ${data.target ?? ""} and status = 'open' and is_demo = false`;
      if (!rows[0]) return { ok: false as const, error: "Scout a real open listing to complete this quest." };
      if (rows[0].owner_wallet === viewer.actor) return { ok: false as const, error: "Scouting your own listing doesn't count." };
    }
    if (data.quest === "rival") {
      const id = Number(data.target);
      if (!Number.isInteger(id) || id === viewer.chogId) return { ok: false as const, error: "Visit a different Chog's record." };
      const owner = await liveOwnerOf(id).catch(() => null);
      if (!owner) return { ok: false as const, error: "That Chog couldn't be read onchain." };
      if (owner === viewer.wallet) return { ok: false as const, error: "That Chog is in your own wallet. Find a real rival." };
    }
    return completeQuest(viewer.sql, viewer.chogId, viewer.wallet, data.quest);
  });
