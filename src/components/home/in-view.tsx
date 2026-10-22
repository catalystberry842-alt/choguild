import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Adds `is-in` while the block is on screen so its CSS loops run only then (paused offscreen). */
export function InView({ as: Tag = "div", className, children, id, ...rest }: { as?: "div" | "section"; className?: string; children: ReactNode; id?: string; "aria-labelledby"?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setInView(true);
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "0px 0px -15% 0px", threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} id={id} className={cn(className, inView && "is-in")} {...rest}>
      {children}
    </Tag>
  );
}

export const HOME_SECTIONS = [
  { id: "chog", label: "Chog" },
  { id: "quests", label: "Quests" },
  { id: "ladder", label: "Leaderboard" },
  { id: "work", label: "Work" },
  { id: "review", label: "Review" },
  { id: "publish", label: "Publish" },
  { id: "how", label: "How" },
] as const;
