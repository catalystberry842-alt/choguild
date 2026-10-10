import { useCallback, useState } from "react";

/** Tracks an element's rendered height with a ResizeObserver (callback ref). */
export function useMeasuredHeight<T extends HTMLElement>() {
  const [height, setHeight] = useState(0);
  const ref = useCallback((node: T | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight));
    observer.observe(node);
    setHeight(node.offsetHeight);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}
