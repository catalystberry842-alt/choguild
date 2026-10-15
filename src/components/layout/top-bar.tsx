import { Link, useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/logo";
import { emptyBoardSearch } from "@/lib/board/search";
import { ArrowLeft, Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { WalletButton } from "@/components/passport/wallet-button";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/ranking", label: "Ranking" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/passport", label: "Passport" },
] as const;

export function TopBar({ title, onOpenPalette }: { title: string; onOpenPalette: () => void }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Detail and form pages (`/discover/abc`, `/submissions/new`) get a back control.
  const nested = pathname.split("/").filter(Boolean).length > 1;

  return (
    <header className="glass sticky top-0 z-30 border-b border-line">
      <div className="h-[env(safe-area-inset-top,0px)]" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Choguild home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={item.to === "/discover" ? emptyBoardSearch() : undefined}
              className="rounded-lg px-3 py-2 text-[14px] text-muted transition-colors hover:text-ink"
              activeProps={{ className: "text-ink" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {nested ? (
          <Button
            variant="ghost"
            size="compact"
            className="px-2"
            aria-label="Go back"
            onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: "/" }))}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        ) : null}
        <span className="sr-only">{title}</span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Search pages and actions"
            className="flex h-9 items-center gap-2 rounded-full border border-line bg-elevated px-3 text-sm text-muted transition-colors hover:border-muted hover:text-ink"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden md:inline">Jump to…</span>
            <kbd className="hidden rounded border border-line px-1 text-[10px] md:inline">⌘K</kbd>
          </button>
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
