/**
 * Tiny in-process cache for slow upstream reads (public RPCs). Fresh values are
 * served for `ttlMs`; after that the stale value is served immediately while a
 * single background refresh runs, so a slow upstream never blocks a render
 * once it has answered at least once.
 */
type Entry<T> = { value: T; at: number; inflight?: Promise<T> };

const store = new Map<string, Entry<unknown>>();

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>, now = Date.now()): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && now - hit.at < ttlMs) return hit.value;
  const refresh = () => {
    const inflight = load().then(
      (value) => {
        store.set(key, { value, at: Date.now() });
        return value;
      },
      (error) => {
        if (hit) store.set(key, { value: hit.value, at: hit.at });
        else store.delete(key);
        throw error;
      },
    );
    store.set(key, { ...(hit ?? { value: undefined as T, at: 0 }), inflight });
    return inflight;
  };
  if (hit && hit.at > 0) {
    if (!hit.inflight) void refresh().catch(() => undefined);
    return hit.value;
  }
  return hit?.inflight ?? refresh();
}

export function resetMemo() {
  store.clear();
}
