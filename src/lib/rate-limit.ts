/**
 * Small sliding-window limiter. In-memory, so on serverless it is per warm
 * instance: enough to stop bursts and scripted spam from one client.
 */
type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

export function takeToken(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) if (!b.hits.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

export function resetRateLimits() {
  buckets.clear();
}
