import * as Dialog from "@radix-ui/react-dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWalletState } from "@/components/passport/wallet-state";
import { LogoMark } from "@/components/brand/logo";
import { usePassport } from "@/components/passport/passport-provider";
import { WalletButton } from "@/components/passport/wallet-button";
import { emptyBoardSearch } from "@/lib/board/search";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isNavActive } from "@/lib/navigation";
import { monadChainLabel } from "@/lib/passport/chain";
import { shortAddress } from "@/lib/passport/format";

const PRIMARY = NAV_ITEMS.filter((item) => item.primary);

/** Floating, centred pill navigation. Logo and links in the middle pill, wallet to the right. */
export function SiteHeader({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <div
        className="header-drop mx-auto flex max-w-6xl items-center gap-2"
      >
        <div className="pill-nav mx-auto flex h-12 min-w-0 items-center gap-1 pr-1.5 pl-4 lg:pl-5">
          <Link to="/" aria-label="Choguild home" className="logo-anim mr-2 flex items-center gap-2 text-ink">
            <LogoMark className="size-5" />
            <span className="t-h3">Choguild</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center lg:flex">
            {PRIMARY.map((item) => {
              const active = isNavActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                  className={cn("relative rounded-full px-3.5 py-1.5 text-small transition-colors", active ? "text-ink" : "text-muted hover:text-ink")}
                >
                  {active ? (
                    <span className="fade-in-soft absolute inset-0 rounded-full bg-white/[0.07]" />
                  ) : null}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={onOpenPalette}
            aria-keyshortcuts="Meta+K Control+K"
            title="Search pages and actions"
            className="ml-1 hidden size-9 items-center justify-center rounded-full text-label text-muted transition-colors hover:bg-white/[0.06] hover:text-ink md:flex"
          >
            <span className="sr-only">Search pages and actions</span>
            <span aria-hidden="true">⌘K</span>
          </button>
          <span className="ml-auto lg:ml-1" />
          <WalletButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { address, isConnected, chainId } = useWalletState();
  const { profile, sessionAddress } = usePassport();
  const network = monadChainLabel(isConnected ? chainId : undefined);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label="Open menu" className="ml-1 flex size-9 flex-col items-center justify-center gap-[5px] rounded-full bg-white/[0.06] lg:hidden">
          <span className="h-px w-3.5 bg-ink" />
          <span className="h-px w-3.5 bg-ink" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" />
        <Dialog.Content asChild>
          <div
            className="fade-in bento fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-1.5rem)] overflow-y-auto p-3 lg:hidden"
          >
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">All Choguild pages and your passport.</Dialog.Description>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-2 text-ink">
                <LogoMark className="size-5" />
                <span className="t-h3">Choguild</span>
              </span>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close menu" className="flex size-9 items-center justify-center rounded-full bg-white/[0.06]">
                  <span className="relative block size-3.5">
                    <span className="absolute top-1/2 left-0 h-px w-3.5 rotate-45 bg-ink" />
                    <span className="absolute top-1/2 left-0 h-px w-3.5 -rotate-45 bg-ink" />
                  </span>
                </button>
              </Dialog.Close>
            </div>
            <nav aria-label="All pages" className="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              {NAV_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.to);
                return (
                  <div key={item.to} className="fade-in" style={{ animationDelay: `${30 * index}ms` }}>
                    <Link
                      to={item.to}
                      search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                      className={cn(
                        "flex flex-row items-center gap-3 rounded-2xl border px-4 py-3 transition-colors min-[360px]:flex-col min-[360px]:items-start min-[360px]:gap-6 min-[360px]:p-4",
                        active ? "border-signal/40 bg-signal/10" : "border-line bg-white/[0.02] hover:border-line-strong",
                      )}
                    >
                      <Icon className={cn("size-4", active ? "text-signal" : "text-muted")} aria-hidden="true" />
                      <span className="t-h3 text-ink">{item.label}</span>
                    </Link>
                  </div>
                );
              })}
            </nav>
            <div className="mt-2 flex flex-col items-start gap-1 rounded-2xl bg-white/[0.03] px-4 py-3 text-small min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
              <span className="truncate text-ink">{profile ? `@${profile.username}` : sessionAddress ? "Signed in" : "Not signed in"}</span>
              <span className="truncate font-mono text-label text-muted">
                {isConnected && address ? `${shortAddress(address)} · ${network.label}` : "No wallet"}
              </span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
