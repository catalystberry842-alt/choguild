import { useMatches } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { AccountPanel } from "@/components/layout/account-panel";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const matches = useMatches();
  const current = [...matches].reverse().find((match) => match.staticData?.title);
  const title = current?.staticData?.title ?? "Choguild";

  return (
    <div className="site-bg min-h-dvh overflow-x-clip text-ink lg:flex">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-elevated focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-sidebar p-4 lg:flex">
        <Logo className="w-16" />
        <PrimaryNav />
        <div className="mt-auto">
          <AccountPanel />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <TopBar title={title} />
        <main id="content" className="mx-auto w-full max-w-[1200px] scroll-mt-[4.5rem] px-6 py-4 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
