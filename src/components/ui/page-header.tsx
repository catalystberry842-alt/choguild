import { motion } from "motion/react";
import type { ReactNode } from "react";
import { WordReveal } from "@/components/fx/reveal";

/** Centred page header: a small pill label, a sans title, a lead and actions. */
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
    <header className="relative mx-auto flex max-w-3xl flex-col items-center pb-12 text-center">
      {eyebrow ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-elevated/70 px-3 py-1 text-label text-body"
        >
          <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
          {eyebrow}
        </motion.p>
      ) : null}
      <h1 className="t-title text-balance">{typeof title === "string" ? <WordReveal lines={[title.split(" ")]} wrap /> : title}</h1>
      {description ? (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="t-lead mt-5 max-w-xl text-balance"
        >
          {description}
        </motion.p>
      ) : null}
      {children}
      {actions ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-7 flex flex-wrap justify-center gap-2.5">
          {actions}
        </motion.div>
      ) : null}
    </header>
  );
}
