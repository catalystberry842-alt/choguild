import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TIERS, tierFor } from "@/lib/ranking/xp";
import { ChogCard, TIER_TITLE } from "./chog-card";
import { Button } from "@/components/ui/button";

const COLORS = ["#836ef9", "#b7a9ff", "#fafafa", "#5b47d6", "#d9d2ff"];

export function burstConfetti(count = 90) {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < count; i += 1) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = COLORS[i % COLORS.length];
    el.style.setProperty("--dx", `${(Math.random() - 0.5) * 240}px`);
    el.style.setProperty("--rot", `${Math.round((Math.random() - 0.5) * 1080)}deg`);
    el.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    el.style.animationDelay = `${Math.random() * 0.25}s`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 3800);
  }
}

const key = (chogId: number) => `choguild:tier:${chogId}`;

/**
 * Remembers the last tier this browser saw for a Chog. When the Chog has climbed since,
 * it throws confetti and shows the new tier card (frame, title, glow) once.
 */
export function LevelUpWatcher({ chogId, xp, name }: { chogId: number; xp: number; name?: string | null }) {
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    const now = tierFor(xp).tier.name;
    const idx = (n: string | null) => TIERS.findIndex((t) => t.name === n);
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(key(chogId));
      window.localStorage.setItem(key(chogId), now);
    } catch {
      return;
    }
    if (seen && idx(now) > idx(seen)) {
      setShown(now);
      burstConfetti();
    }
  }, [chogId, xp]);
  if (!shown || typeof document === "undefined") return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Level up" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={() => setShown(null)}>
      <div className="levelup-in surface flex w-full max-w-sm flex-col items-center gap-4 p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="tier-title text-[#836ef9]">Level up</p>
        <h2 className="t-h2">Chog #{chogId} is now {TIER_TITLE[shown] ?? shown}</h2>
        <ChogCard chogId={chogId} name={name} xp={xp} size="sm" />
        <Button size="compact" onClick={() => setShown(null)}>Nice</Button>
      </div>
    </div>,
    document.body,
  );
}
