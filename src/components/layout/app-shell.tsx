import { useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

// cmdk + the palette load only the first time it is opened (⌘K or the header button).
const CommandPalette = lazy(() => import("@/components/layout/command-palette").then((m) => ({ default: m.CommandPalette })));
import { RouteProgress } from "@/components/layout/route-progress";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteLoaded(true);
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const home = pathname === "/";

  return (
    <>
      <div className="relative min-h-dvh overflow-x-clip text-ink">
        <div className="orbs" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className={home ? "atmos atmos-home" : "atmos"} aria-hidden="true" />
        <RouteProgress />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader onOpenPalette={() => { setPaletteLoaded(true); setPaletteOpen(true); }} />
        <main
          id="content"
          className={
            home
              ? "relative z-10 scroll-mt-16"
              : "relative z-10 mx-auto w-full max-w-6xl 2xl:max-w-7xl scroll-mt-16 px-4 pt-14 sm:px-6 md:pt-20"
          }
        >
          {/* CSS fade (no JS animation loop) so navigation commits immediately. */}
          <div key={pathname} className="route-fade">
            {children}
          </div>
        </main>
        <SiteFooter />
        {paletteLoaded ? (
          <Suspense fallback={null}>
            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
