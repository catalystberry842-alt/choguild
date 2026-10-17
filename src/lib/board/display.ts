export function plainCopy(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function projectLabel(name: string): string {
  return plainCopy(name);
}

export function cardSummary(summary: string): string {
  const cleaned = plainCopy(summary);
  if (!cleaned) return "";
  const sentence = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

/** Human countdown for a deadline ISO string. Null when there is no deadline. */
export function deadlineCountdown(deadline: string | null | undefined, now = Date.now()): string | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - now;
  if (ms <= 0) return "Past due";
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return hours === 1 ? "1 hour left" : `${hours} hours left`;
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/** Prefer a usable image URL; reject obvious non-image pages (e.g. social profile links). */
export function usableImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const host = new URL(trimmed).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "x.com" || host === "twitter.com" || host === "t.co") return null;
  } catch {
    return null;
  }
  return trimmed;
}
