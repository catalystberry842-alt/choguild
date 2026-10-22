import { CHOG_BOOST_CAP, CHOG_BOOST_RATE, CHOG_EXPLORER_URL, chogImageUrl, type ChogHolding } from "@/lib/chog/chog";
import { cn } from "@/lib/cn";

/** Small pill shown next to holders. */
export function ChogBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 text-label font-medium text-ink ring-1 ring-signal/40",
        className,
      )}
      title={`Holds ${count} Chog Genesis NFT${count === 1 ? "" : "s"}`}
    >
      <span aria-hidden="true" className="text-signal">◆</span>
      Chog holder{count > 1 ? ` ×${count}` : ""}
    </span>
  );
}

/** One Chog image, lazy-loaded from our edge-cached IPFS route. */
export function ChogImage({ tokenId, size = "md", className }: { tokenId: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = size === "lg" ? 96 : size === "sm" ? 36 : 56;
  const box = size === "sm" ? "size-9" : size === "lg" ? "size-24" : "size-14";
  return (
    <img
      src={chogImageUrl(tokenId)}
      alt={`Chog Genesis #${tokenId}`}
      loading="lazy"
      decoding="async"
      width={px}
      height={px}
      className={cn(box, "shrink-0 rounded-2xl bg-secondary object-cover ring-1 ring-signal/40", className)}
    />
  );
}

/** The holder's Chogs on a passport. */
export function ChogGallery({ holding }: { holding: ChogHolding | null | undefined }) {
  if (!holding || holding.count === 0) return null;
  const shown = holding.tokenIds.slice(0, 6);
  return (
    <section aria-labelledby="chog-title" className="bento p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="chog-title" className="t-h3">Chog Genesis</h2>
        <ChogBadge count={holding.count} />
      </div>
      <ul className="mt-5 flex flex-wrap gap-3">
        {shown.map((id) => (
          <li key={id} className="flex flex-col items-center gap-1.5">
            <ChogImage tokenId={id} size="lg" />
            <span className="text-label tabular-nums text-muted">#{id}</span>
          </li>
        ))}
      </ul>
      <p className="t-meta mt-4">
        Read live from the{" "}
        <a href={CHOG_EXPLORER_URL} target="_blank" rel="noreferrer" className="t-link">Chog Genesis contract</a> on Monad.
        Holders get +{Math.round(CHOG_BOOST_RATE * 100)}% guild XP (up to +{CHOG_BOOST_CAP}).
        {holding.count > shown.length ? ` Showing ${shown.length} of ${holding.count}.` : ""}
      </p>
    </section>
  );
}

/** Marks a listing gated to Chog Genesis holders. */
export function HoldersOnlyPill({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1 rounded-full bg-signal/15 px-2.5 py-0.5 text-label font-medium text-ink ring-1 ring-signal/40", className)}>
      <span aria-hidden="true" className="text-signal">◆</span>
      Chog holders only
    </span>
  );
}

export function RewardPill({ amount, className }: { amount: string; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-label font-medium text-ink ring-1 ring-line-strong", className)}>
      <span aria-hidden="true" className="text-signal">●</span>
      {Number(amount).toLocaleString("en-US", { maximumFractionDigits: 4 })} $CHOG reward
    </span>
  );
}
