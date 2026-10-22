import { Download, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { chogImageUrl } from "@/lib/chog/chog";
import { formatXp, tierFor } from "@/lib/ranking/xp";
import { TIER_TITLE } from "./chog-card";

export type RankCardData = {
  chogId: number;
  name: string;
  xp: number;
  rank: number | null;
  of: number | null;
  seasonRank: number | null;
  season: number;
  streak: number;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws the 1200×675 share card (X summary_large_image ratio) in the browser. */
export async function drawRankCard(data: RankCardData): Promise<Blob | null> {
  const W = 1200;
  const H = 675;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  await document.fonts?.ready;
  const { tier, next, progress } = tierFor(data.xp);
  const strong = tier.name === "Guildmaster" || tier.name === "Legend";
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1f1f1f";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Chog art with the tier frame
  const art = await loadImage(chogImageUrl(data.chogId));
  const ax = 72, ay = 96, as = 483;
  if (strong) {
    ctx.save();
    ctx.shadowColor = "rgba(131,110,249,0.8)";
    ctx.shadowBlur = tier.name === "Legend" ? 60 : 36;
    ctx.fillStyle = "#836ef9";
    roundRect(ctx, ax - 6, ay - 6, as + 12, as + 12, 30);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  roundRect(ctx, ax, ay, as, as, 26);
  ctx.clip();
  ctx.fillStyle = "#171717";
  ctx.fillRect(ax, ay, as, as);
  if (art) ctx.drawImage(art, ax, ay, as, as);
  ctx.restore();
  const frameWidth = { Hatchling: 2, Apprentice: 3, Artisan: 5, Guildmaster: 6, Legend: 8 }[tier.name] ?? 2;
  ctx.lineWidth = frameWidth;
  ctx.strokeStyle = tier.name === "Hatchling" ? "#2e2e2e" : "#836ef9";
  roundRect(ctx, ax, ay, as, as, 26);
  ctx.stroke();

  const tx = 620;
  ctx.fillStyle = "#836ef9";
  ctx.font = "600 22px 'DM Sans', 'Geist Sans', sans-serif";
  ctx.fillText((TIER_TITLE[tier.name] ?? tier.name).toUpperCase(), tx, 140);
  ctx.fillStyle = "#fafafa";
  ctx.font = "600 64px 'Geist Sans', 'DM Sans', sans-serif";
  let name = data.name;
  while (ctx.measureText(name).width > 500 && name.length > 4) name = `${name.slice(0, -2)}…`;
  ctx.fillText(name, tx, 215);
  ctx.fillStyle = "#a1a1a1";
  ctx.font = "400 28px 'DM Sans', sans-serif";
  ctx.fillText(`Chog Genesis #${data.chogId}`, tx, 260);

  const stats: [string, string][] = [
    ["Rank", data.rank ? `#${data.rank}` : "—"],
    [`Season ${data.season}`, data.seasonRank ? `#${data.seasonRank}` : "—"],
    ["XP", formatXp(data.xp)],
    ["Streak", `${data.streak}d`],
  ];
  stats.forEach(([label, value], i) => {
    const x = tx + (i % 2) * 260;
    const y = 345 + Math.floor(i / 2) * 110;
    ctx.fillStyle = "#737373";
    ctx.font = "500 20px 'DM Sans', sans-serif";
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = "#fafafa";
    ctx.font = "600 48px 'Geist Sans', sans-serif";
    ctx.fillText(value, x, y + 52);
  });
  ctx.fillStyle = "#2e2e2e";
  roundRect(ctx, tx, 560, 500, 10, 5);
  ctx.fill();
  ctx.fillStyle = "#836ef9";
  roundRect(ctx, tx, 560, Math.max(10, 500 * progress), 10, 5);
  ctx.fill();
  ctx.fillStyle = "#737373";
  ctx.font = "400 20px 'DM Sans', sans-serif";
  ctx.fillText(next ? `${formatXp(next.min - data.xp)} XP to ${next.name}` : "Max tier", tx, 600);
  ctx.textAlign = "right";
  ctx.fillStyle = "#fafafa";
  ctx.font = "600 22px 'Geist Sans', sans-serif";
  ctx.fillText("choguild.vercel.app", W - 72, 600);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Download / share the rank card, plus an X post intent linking this Chog's record. */
export function RankCardActions({ data }: { data: RankCardData }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const url = typeof window === "undefined" ? `https://choguild.vercel.app/chog/${data.chogId}` : `${window.location.origin}/chog/${data.chogId}`;
  const { tier } = tierFor(data.xp);
  const text = `Chog #${data.chogId} is ${TIER_TITLE[tier.name] ?? tier.name}${data.rank ? `, rank #${data.rank}` : ""} on Choguild with ${formatXp(data.xp)} XP${data.streak ? ` and a ${data.streak}-day streak` : ""}. The NFT is the member: its record travels with it.`;
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  async function make(kind: "download" | "share") {
    setBusy(true);
    try {
      const blob = await drawRankCard(data);
      if (!blob) return;
      const file = new File([blob], `chog-${data.chogId}-rank.png`, { type: "image/png" });
      if (kind === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url }).catch(() => undefined);
        return;
      }
      const href = URL.createObjectURL(blob);
      setPreview(href);
      const a = document.createElement("a");
      a.href = href;
      a.download = file.name;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button size="compact" onClick={() => void make("download")} disabled={busy}>
          <Download className="size-4" aria-hidden="true" />
          {busy ? "Drawing…" : "Rank card"}
        </Button>
        <Button asChild size="compact" variant="secondary">
          <a href={intent} target="_blank" rel="noreferrer">
            <Share2 className="size-4" aria-hidden="true" />
            Post on X
          </a>
        </Button>
      </div>
      {preview ? <img src={preview} alt={`Rank card for Chog #${data.chogId}`} className="w-full max-w-md rounded-xl border border-line" /> : null}
      <p className="t-meta">The card downloads as a PNG; attach it to your post. On phones the share sheet opens instead.</p>
    </div>
  );
}
