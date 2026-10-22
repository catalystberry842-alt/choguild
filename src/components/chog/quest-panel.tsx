import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Flame } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { emptyBoardSearch } from "@/lib/board/search";
import { doQuest, getQuestBoard } from "@/lib/quests/functions";
import { QUESTS, STREAK_BONUS_CAP, questXp, type QuestId } from "@/lib/quests/quests";
import { burstConfetti } from "./level-up";

type Board = Awaited<ReturnType<typeof getQuestBoard>>;

/** Today's three Chog quests with the check-in streak. */
export function QuestPanel({ onXp }: { onXp?: (xp: number) => void }) {
  const load = useServerFn(getQuestBoard);
  const run = useServerFn(doQuest);
  const [board, setBoard] = useState<Board | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => load().then(setBoard).catch(() => setBoard(null)), [load]);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function checkIn() {
    setBusy(true);
    setError(null);
    try {
      const result = await run({ data: { quest: "checkin" } });
      if (!result.ok) setError(result.error);
      else {
        setBoard({ chogId: board!.chogId, ...result.board });
        setPop(result.xp);
        burstConfetti(28);
        onXp?.(result.xp);
        window.setTimeout(() => setPop(null), 1000);
      }
    } finally {
      setBusy(false);
    }
  }

  if (board === undefined) return <div className="surface h-40 animate-pulse" aria-label="Loading quests" />;
  if (board === null) return <p className="t-body">Act as a Chog you own to take daily quests.</p>;
  const done = new Set(board.done);
  const nextStreak = done.has("checkin") ? board.streak : board.streak + 1;

  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-small text-ink">
          <Flame className="size-4 text-[#836ef9]" aria-hidden="true" />
          <span className="font-semibold tabular-nums">{board.streak}-day streak</span>
          <span className="text-muted">· +{board.todayXp} XP today</span>
        </p>
        <p className="t-meta">Resets 00:00 UTC (01:00 Lagos)</p>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {QUESTS.map((quest) => {
          const isDone = done.has(quest.id);
          const blocked = board.blockedBy[quest.id as QuestId];
          const xp = questXp(quest.id, quest.id === "checkin" ? nextStreak : 0);
          return (
            <li key={quest.id} data-done={isDone} className="quest-row flex items-center gap-3 py-3">
              <span className="quest-check" aria-hidden="true">{isDone ? <Check className="size-3" /> : null}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-medium text-ink">{quest.label}</span>
                <span className="block text-label text-muted">
                  {blocked ? `Done today by your Chog #${blocked}. One Chog per wallet per quest.` : quest.detail}
                </span>
              </span>
              <span className="relative shrink-0 text-small tabular-nums text-muted">
                +{xp}
                {quest.id === "checkin" && pop ? <span className="xp-pop absolute -top-4 right-0 font-semibold text-[#836ef9]">+{pop}</span> : null}
              </span>
              {isDone || blocked ? null : quest.id === "checkin" ? (
                <Button size="compact" onClick={() => void checkIn()} disabled={busy}>{busy ? "…" : "Check in"}</Button>
              ) : quest.id === "scout" ? (
                <Button asChild size="compact" variant="secondary"><Link to="/discover" search={emptyBoardSearch()}>Board</Link></Button>
              ) : (
                <Button asChild size="compact" variant="secondary"><Link to="/ranking">Rivals</Link></Button>
              )}
            </li>
          );
        })}
      </ul>
      {error ? <p role="alert" className="mt-2 text-small text-danger">{error}</p> : null}
      <p className="t-meta mt-2">Check-in earns +1 XP per streak day (up to +{STREAK_BONUS_CAP}). Quests also count toward this week's season.</p>
    </div>
  );
}

/** Fire-and-forget quest completion for passive quests (scouting a listing, visiting a rival). */
export function useQuestPing(quest: "scout" | "rival", target: string | null, enabled: boolean) {
  const run = useServerFn(doQuest);
  useEffect(() => {
    if (!enabled || !target) return;
    const flag = `choguild:quest:${quest}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (window.sessionStorage.getItem(flag)) return;
    } catch {
      /* storage blocked: still try */
    }
    const t = window.setTimeout(() => {
      run({ data: { quest, target } })
        .then((r) => {
          if (r.ok) burstConfetti(18);
          if (r.ok || /Already done|already did/.test(r.error)) window.sessionStorage.setItem(flag, "1");
        })
        .catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [run, quest, target, enabled]);
}
