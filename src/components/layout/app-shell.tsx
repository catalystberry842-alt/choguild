import { useRouterState } from "@tanstack/react-router";
import { MotionConfig, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { CommandPalette } from "@/components/layout/command-palette";
import { RouteProgress } from "@/components/layout/route-progress";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const home = pathname === "/";

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh overflow-x-clip text-ink">
        <div className={home ? "atmos atmos-home" : "atmos"} aria-hidden="true" />
        <div className="guides" aria-hidden="true">
          <div />
        </div>
        <RouteProgress />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader onOpenPalette={() => setPaletteOpen(true)} />
        <main
          id="content"
          className={
            home
              ? "relative z-10 scroll-mt-16"
              : "relative z-10 mx-auto w-full max-w-7xl scroll-mt-16 px-5 pt-12 sm:px-8 md:pt-20"
          }
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
        <SiteFooter />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </MotionConfig>
  );
}
