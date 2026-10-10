import { useMatches, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { AccountPanel } from "@/components/layout/account-panel";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { CommandPalette } from "@/components/layout/command-palette";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { RouteProgress } from "@/components/layout/route-progress";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const matches = useMatches();
  const current = [...matches].reverse().find((match) => match.staticData?.title);
  const title = current?.staticData?.title ?? "Choguild";
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="site-bg relative min-h-dvh overflow-x-clip text-ink lg:flex">
      <RouteProgress />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-elevated focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 z-10 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-canvas p-4 lg:flex">
        <div className="flex items-center gap-3">
          <Logo className="w-12" />
          <div>
            <p className="text-lg leading-none font-bold tracking-tight text-ink">Choguild</p>
            <p className="mt-1 text-[11px] font-medium tracking-wide text-muted uppercase">Built on Monad</p>
          </div>
        </div>
        <PrimaryNav />
        <div className="mt-auto">
          <AccountPanel />
        </div>
      </aside>
      <div className="relative z-10 min-w-0 flex-1">
        <TopBar title={title} onOpenPalette={() => setPaletteOpen(true)} />
        <main
          id="content"
          className="mx-auto w-full max-w-[1200px] scroll-mt-[4.5rem] px-4 pt-4 pb-28 sm:px-6 md:pt-8 lg:pb-12"
        >
          {/* Keyed on the path (not search) so filters keep state while pages animate in. */}
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
      <BottomTabs />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
