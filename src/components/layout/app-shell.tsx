import { useMatches, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CommandPalette } from "@/components/layout/command-palette";
import { GuildDock } from "@/components/layout/guild-dock";
import { LandingNav } from "@/components/layout/landing-nav";
import { RouteProgress } from "@/components/layout/route-progress";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const matches = useMatches();
  const current = [...matches].reverse().find((match) => match.staticData?.title);
  const title = current?.staticData?.title ?? "Choguild";
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);

  // The home page is a full-bleed landing with its own floating nav; inner
  // pages share the app header, single column and dock.
  if (pathname === "/") {
    return (
      <div className="landing relative min-h-dvh overflow-x-clip">
        <RouteProgress />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-elevated focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <LandingNav />
        <main id="content">{children}</main>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    );
  }

  return (
    <div className="site-bg relative min-h-dvh overflow-x-clip text-ink">
      <RouteProgress />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-elevated focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <TopBar title={title} onOpenPalette={() => setPaletteOpen(true)} />
      <main id="content" className="mx-auto w-full max-w-3xl scroll-mt-[4.5rem] px-5 pt-8 pb-40 sm:px-8 md:pt-14">
        {/* Keyed on the path (not search) so filters keep state while pages animate in. */}
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
      <GuildDock />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
