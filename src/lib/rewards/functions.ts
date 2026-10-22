import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "@/lib/schemas";

const target = z.object({ kind: z.enum(["application", "submission"]), id: z.string().min(1).max(80) });

export const getRewardStatus = createServerFn({ method: "GET" })
  .validator((input: unknown) => S.parseInput(target, input))
  .handler(async ({ data }) => {
    const { resolveViewer, liveOwnerOf } = await import("@/lib/chog/actor.server");
    const { loadTarget, paymentFor } = await import("./repo.server");
    const viewer = await resolveViewer();
    const t = await loadTarget(viewer.sql, data.kind, data.id);
    if (!t || !t.reward || !t.chogId) return null;
    const payment = await paymentFor(viewer.sql, t.opportunityId, t.chogId);
    const isPublisher = Boolean(viewer.actor && viewer.actor === t.ownerActor);
    const holder = isPublisher && t.status === "accepted" && !payment ? await liveOwnerOf(t.chogId).catch(() => null) : null;
    return { reward: t.reward, chogId: t.chogId, accepted: t.status === "accepted", isPublisher, holder, payment };
  });

export const recordRewardPayment = createServerFn({ method: "POST" })
  .validator((input: unknown) => S.parseInput(target.extend({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) }), input))
  .handler(async ({ data }) => {
    const { assertSameOrigin } = await import("@/lib/passport/origin.server");
    assertSameOrigin();
    const { resolveViewer, liveOwnerOf, monadClient } = await import("@/lib/chog/actor.server");
    const { loadTarget, paymentFor, insertPayment } = await import("./repo.server");
    const { matchTransfer, rewardWei } = await import("./rewards");
    const viewer = await resolveViewer().catch(() => null);
    if (!viewer?.wallet || !viewer.actor) return { ok: false as const, error: "Act as the Chog that published this listing." };
    const t = await loadTarget(viewer.sql, data.kind, data.id);
    if (!t || !t.reward || !t.chogId) return { ok: false as const, error: "This listing has no $CHOG reward." };
    if (t.ownerActor !== viewer.actor) return { ok: false as const, error: "Only the publisher can record the reward." };
    if (t.status !== "accepted") return { ok: false as const, error: "Rewards are paid on acceptance." };
    if (await paymentFor(viewer.sql, t.opportunityId, t.chogId)) return { ok: false as const, error: "Already paid." };
    const holder = await liveOwnerOf(t.chogId, { fresh: true }).catch(() => null);
    if (!holder) return { ok: false as const, error: "Couldn't read the Chog's holder from Monad. Try again." };
    let receipt;
    try {
      receipt = await monadClient().waitForTransactionReceipt({ hash: data.txHash as `0x${string}`, timeout: 45_000 });
    } catch {
      return { ok: false as const, error: "The transaction isn't confirmed yet. Try verifying again in a moment." };
    }
    if (receipt.status !== "success") return { ok: false as const, error: "That transaction reverted." };
    const amount = matchTransfer(receipt.logs, { from: viewer.wallet, to: holder, minWei: rewardWei(t.reward) });
    if (amount === null) {
      return { ok: false as const, error: `No $CHOG transfer of at least ${t.reward} from your wallet to Chog #${t.chogId}'s holder was found in that transaction.` };
    }
    const saved = await insertPayment(viewer.sql, { target: t, chogId: t.chogId, payer: viewer.wallet, payee: holder, amountWei: amount, txHash: data.txHash.toLowerCase() });
    if (!saved.ok) return saved;
    return { ok: true as const, payment: await paymentFor(viewer.sql, t.opportunityId, t.chogId) };
  });

export const getChogPaid = createServerFn({ method: "GET" })
  .validator((id: unknown) => S.parseInput(z.coerce.number().int().min(1).max(1969), id))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const { paidTotal } = await import("./repo.server");
    return paidTotal(await getSql(), data);
  });
