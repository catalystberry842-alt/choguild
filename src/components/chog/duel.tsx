import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Share2, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { chogImageUrl } from "@/lib/chog/chog";
import { DAILY_DUELS, MOVES, ROUNDS, signatureMove, type MoveId } from "@/lib/duels/duels";
import type { DuelRow } from "@/lib/duels/repo.server";
import { startDuel } from "@/lib/duels/functions";
import { cn } from "@/lib/cn";
import { burstConfetti } from "./level-up";

const LABEL: Record<MoveId, string> = { charge: "Charge", guard: "Guard", trick: "Trick" };
const GLYPH: Record<MoveId, string> = { charge: "⚡", guard: "🛡", trick: "🌀" };

export function duelShareUrl(duel: DuelRow): string {
  const text = duel.outcome === "win"
    ? `Chog #${duel.challengerId} beat Chog #${duel.defenderId} ${duel.challengerScore}-${duel.defenderScore} in a Choguild duel.`
    : duel.outcome === "loss"
      ? `Chog #${duel.defenderId} held off Chog #${duel.challengerId} ${duel.defenderScore}-${duel.challengerScore} in a Choguild duel.`
      : `Chog #${duel.challengerId} and Chog #${duel.defenderId} drew a Choguild duel.`;
  const url = typeof window !== "undefined" ? `${window.location.origin}/duel/${duel.id}` : `https://choguild.vercel.app/duel/${duel.id}`;
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/** Both Chogs face off, rounds reveal one by one, then the result. Used in the overlay and on /duel/:id. */
export function DuelArena({ duel, animate = true }: { duel: DuelRow; animate?: boolean }) {
  const [shown, setShown] = useState(animate ? 0 : ROUNDS + 1);
  useEffect(() => {
    if (!animate) return;
    const timers = Array.from({ length: ROUNDS + 1 }, (_, i) => window.setTimeout(() => setShown(i + 1), 700 + i * 750));
    return () => timers.forEach(clearTimeout);
  }, [animate, duel.id]);
  useEffect(() => {
    if (animate && shown === ROUNDS + 1 && duel.outcome === "win") burstConfetti(70);
  }, [animate, shown, duel.outcome]);
  const done = shown > ROUNDS;
  const headline = duel.outcome === "win" ? `#${duel.challengerId} wins` : duel.outcome === "loss" ? `#${duel.defenderId} holds` : "Draw";
  const side = (id: number, score: number, won: boolean) => (
    <div className={cn("duel-side flex min-w-0 flex-col items-center gap-2", done && won && "duel-won")}>
      <img src={chogImageUrl(id)} alt={`Chog Genesis #${id}`} width={240} height={240} className="aspect-square w-full max-w-[9rem] rounded-xl bg-secondary object-cover" />
      <p className="text-small font-semibold text-ink">Chog #{id}</p>
      <p className="text-lead font-semibold tabular-nums text-ink">{done ? score : "·"}</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {side(duel.challengerId, duel.challengerScore, duel.outcome === "win")}
        <span className="duel-vs t-kicker text-[#836ef9]">VS</span>
        {side(duel.defenderId, duel.defenderScore, duel.outcome === "loss")}
      </div>
      <ol className="grid gap-1.5">
        {Array.from({ length: ROUNDS }, (_, i) => {
          const r = { c: duel.challengerPicks[i], d: duel.defenderPicks[i] };
          const beats = (a: MoveId, b: MoveId) => MOVES.find((m) => m.id === a)!.beats === b;
          const w = beats(r.c, r.d) ? "c" : beats(r.d, r.c) ? "d" : duel.challengerLevel === duel.defenderLevel ? "tie" : duel.challengerLevel > duel.defenderLevel ? "c" : "d";
          const edge = !beats(r.c, r.d) && !beats(r.d, r.c) && w !== "tie";
          return (
            <li key={i} className={cn("surface grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-small transition-opacity", i < shown ? "duel-round opacity-100" : "opacity-0")}>
              <span className={cn("truncate", w === "c" ? "font-semibold text-ink" : "text-muted")}>{GLYPH[r.c]} {LABEL[r.c]}</span>
              <span className="t-meta">{w === "tie" ? "tie" : edge ? "tier edge" : `round ${i + 1}`}</span>
              <span className={cn("truncate text-right", w === "d" ? "font-semibold text-ink" : "text-muted")}>{LABEL[r.d]} {GLYPH[r.d]}</span>
            </li>
          );
        })}
      </ol>
      <div className={cn("flex flex-col items-center gap-1 text-center transition-opacity", done ? "opacity-100" : "opacity-0")}>
        <p className="t-h3">{headline}</p>
        <p className="t-meta">
          +{duel.challengerXp} XP to #{duel.challengerId}
          {duel.defenderXp ? ` · +${duel.defenderXp} XP to #${duel.defenderId}` : ""}
        </p>
      </div>
    </div>
  );
}

/** Challenge form on a rival's page: pick three moves, the defender auto-plays on the server. */
export function DuelChallenge({ defenderId, actingId, left }: { defenderId: number; actingId: number | null; left: number | null }) {
  const router = useRouter();
  const run = useServerFn(startDuel);
  const [picks, setPicks] = useState<(MoveId | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DuelRow | null>(null);
  const sig = signatureMove(defenderId);
  const ready = picks.every(Boolean);

  async function fight() {
    setBusy(true);
    setError(null);
    try {
      const r = await run({ data: { defenderId, picks: picks as MoveId[] } });
      if (!r.ok) setError(r.error);
      else setResult(r.duel);
    } catch {
      setError("The duel didn't go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setResult(null);
    setPicks([null, null, null]);
    void router.invalidate();
  }

  if (!actingId) {
    return <p className="t-body surface p-4">Act as a Chog you hold to challenge #{defenderId}. Signed out or without a Chog, duels are view only.</p>;
  }
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <p className="t-body">
        Three rounds. Charge beats Trick, Trick beats Guard, Guard beats Charge; a tied round goes to the higher tier. #{defenderId}'s signature move is{" "}
        <span className="font-semibold text-ink">{LABEL[sig]}</span> and it throws it about half the time.
      </p>
      <div className="grid gap-2">
        {picks.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <span className="t-meta w-16">Round {i + 1}</span>
            {MOVES.map((m) => (
              <Button key={m.id} size="compact" variant={p === m.id ? "primary" : "secondary"} aria-pressed={p === m.id}
                onClick={() => setPicks((prev) => prev.map((x, j) => (j === i ? m.id : x)))}>
                {GLYPH[m.id]} {m.label}
              </Button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="compact" onClick={() => void fight()} disabled={!ready || busy || left === 0}>
          <Swords className="size-3.5" aria-hidden="true" /> {busy ? "Dueling…" : `Duel as #${actingId}`}
        </Button>
        <span className="t-meta">{left === null ? `${DAILY_DUELS} duels a day per wallet` : `${left} of ${DAILY_DUELS} duels left today`}</span>
      </div>
      {error ? <p role="alert" className="text-small text-danger">{error}</p> : null}
      {result && typeof document !== "undefined"
        ? createPortal(
            <div role="dialog" aria-modal="true" aria-label="Duel result" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={close}>
              <div className="levelup-in surface flex w-full max-w-md flex-col gap-4 p-5" onClick={(e) => e.stopPropagation()}>
                <DuelArena duel={result} />
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild size="compact"><a href={duelShareUrl(result)} target="_blank" rel="noreferrer"><Share2 className="size-3.5" aria-hidden="true" /> Share on X</a></Button>
                  <Button asChild size="compact" variant="secondary"><Link to="/duel/$duelId" params={{ duelId: result.id }}>Result card</Link></Button>
                  <Button size="compact" variant="ghost" onClick={close}>Close</Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function DuelHistory({ chogId, history }: { chogId: number; history: DuelRow[] }) {
  if (history.length === 0) return <p className="t-meta">No duels yet.</p>;
  return (
    <ul className="grid gap-2">
      {history.map((d) => {
        const asChallenger = d.challengerId === chogId;
        const rival = asChallenger ? d.defenderId : d.challengerId;
        const won = asChallenger ? d.outcome === "win" : d.outcome === "loss";
        const label = d.outcome === "draw" ? "Draw" : won ? "Won" : "Lost";
        const xp = asChallenger ? d.challengerXp : d.defenderXp;
        return (
          <li key={d.id}>
            <Link to="/duel/$duelId" params={{ duelId: d.id }} className="surface flex items-center gap-3 p-3 hover:border-line-strong">
              <img src={chogImageUrl(rival)} alt="" width={40} height={40} className="size-10 rounded-lg bg-secondary object-cover" />
              <span className="min-w-0 flex-1 truncate text-small text-ink">
                {asChallenger ? "Challenged" : "Defended vs"} Chog #{rival}
              </span>
              <span className={cn("text-small font-semibold tabular-nums", won ? "text-[#836ef9]" : "text-muted")}>
                {label} {asChallenger ? `${d.challengerScore}-${d.defenderScore}` : `${d.defenderScore}-${d.challengerScore}`}
              </span>
              <span className="t-meta w-14 text-right tabular-nums">+{xp} XP</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
