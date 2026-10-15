import { motion } from "motion/react";
import type { ReactNode } from "react";
import { WordReveal } from "@/components/fx/reveal";

/** Editorial page header: a mono index label, a serif title that rises in, a lead and actions, closed by a drawn rule. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative pb-10">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          {eyebrow ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="t-eyebrow mb-5">
              {eyebrow}
            </motion.p>
          ) : null}
          <h1 className="t-title">
            {typeof title === "string" ? <WordReveal lines={[title.split(" ")]} wrap /> : title}
          </h1>
          {description ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="t-lead mt-5 max-w-xl"
            >
              {description}
            </motion.p>
          ) : null}
          {children}
        </div>
        {actions ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center gap-2.5 lg:col-span-4 lg:justify-end"
          >
            {actions}
          </motion.div>
        ) : null}
      </div>
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-line-strong"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
      />
    </header>
  );
}
