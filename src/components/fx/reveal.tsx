import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as = "div",
  ...rest
}: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
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
            const d = delay + index++ * 0.07;
            return [
              i > 0 ? " " : null,
              <span key={i} className="-my-[0.12em] inline-block overflow-hidden py-[0.12em] align-bottom">
                <motion.span
                  className={`inline-block will-change-transform ${wordClassName}`}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE, delay: d }}
                >
                  {word}
                </motion.span>
              </span>,
            ];
          })}
        </span>
      ))}
    </span>
  );
}
