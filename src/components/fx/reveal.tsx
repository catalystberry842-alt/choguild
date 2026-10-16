import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

/**
 * Fades and lifts its children in the first time they scroll into view.
 * Progressive enhancement: the server HTML is fully visible (no-JS users see
 * everything). After hydration, only elements still below the fold are hidden
 * and then revealed on scroll; anything already on screen never flickers.
 */
export function Reveal({
  children,
  delay = 0,
  y = 10,
  className,
  as = "div",
  animate = true,
  style,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li";
  animate?: boolean;
} & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!animate || !node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already visible: leave it alone
    node.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.dataset.reveal = "shown";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.dataset.reveal = "shown";
    };
  }, [animate]);
  const Comp = as as "div";
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      {...rest}
      className={className}
      style={{ ["--reveal-y" as string]: `${y}px`, ["--reveal-delay" as string]: `${Math.round(Math.min(delay, 0.2) * 1000)}ms`, ...style }}
    >
      {children}
    </Comp>
  );
}

/** Headline that reveals word by word. Each line is kept as one unbreakable unit. */
export function WordReveal({
  lines,
  className,
  wordClassName = "",
  delay = 0,
  wrap = false,
}: {
  lines: ReactNode[][];
  className?: string;
  wordClassName?: string;
  delay?: number;
  /** Let the words wrap naturally instead of keeping each line on one row. */
  wrap?: boolean;
}) {
  let index = 0;
  return (
    <span className={className}>
      {lines.map((words, line) => (
        <span key={line} className={wrap ? "inline" : "block whitespace-nowrap"}>
          {words.map((word, i) => {
            const d = delay + index++ * 0.05;
            return [
              i > 0 ? " " : null,
              <span key={i} className="-my-[0.12em] inline-block overflow-hidden py-[0.12em] align-bottom">
                {/* CSS animation, so the words rise from the server-rendered HTML before hydration. */}
                <span
                  className={`word-rise inline-block ${wordClassName}`}
                  style={{ animationDelay: `${Math.round(d * 1000)}ms` }}
                >
                  {word}
                </span>
              </span>,
            ];
          })}
        </span>
      ))}
    </span>
  );
}
