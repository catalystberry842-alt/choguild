import * as Dialog from "@radix-ui/react-dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Wordmark } from "@/components/brand/logo";
import { usePassport } from "@/components/passport/passport-provider";
import { WalletButton } from "@/components/passport/wallet-button";
import { emptyBoardSearch } from "@/lib/board/search";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isNavActive } from "@/lib/navigation";
import { monadChainLabel } from "@/lib/passport/chain";
import { shortAddress } from "@/lib/passport/format";

const PRIMARY = NAV_ITEMS.filter((item) => item.primary);

/** Editorial top bar: wordmark, numbered primary nav, jump, passport, wallet. A full-screen menu on mobile. */
export function SiteHeader({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { profile } = usePassport();

  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="h-[env(safe-area-inset-top,0px)]" aria-hidden="true" />
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link to="/" aria-label="Choguild home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden h-full items-stretch lg:flex">
          {PRIMARY.map((item, index) => {
            const active = isNavActive(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 text-[13px] transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <span className="font-mono text-[10px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3.5 -bottom-px h-px bg-signal"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Search pages and actions"
            className="hidden h-8 items-center gap-3 rounded-md border border-line px-2.5 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-ink md:flex"
          >
            Jump to
            <kbd className="font-mono text-[10px] text-faint">⌘K</kbd>
          </button>
          <Link
            to="/passport"
            className="hidden h-8 items-center rounded-md px-2.5 text-[13px] text-muted transition-colors hover:text-ink sm:flex"
          >
            {profile ? `@${profile.username}` : "Passport"}
          </Link>
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
  const { address, isConnected, chainId } = useAccount();
  const { profile, sessionAddress } = usePassport();
  const network = monadChainLabel(isConnected ? chainId : undefined);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-8 w-9 flex-col items-center justify-center gap-[5px] rounded-md border border-line lg:hidden"
        >
          <span className="h-px w-4 bg-ink" />
          <span className="h-px w-4 bg-ink" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-canvas lg:hidden">
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">All Choguild pages and your passport.</Dialog.Description>
          <div className="h-[env(safe-area-inset-top,0px)]" aria-hidden="true" />
          <div className="flex h-14 items-center justify-between border-b border-line px-5 sm:px-8">
            <Wordmark />
            <Dialog.Close asChild>
              <button type="button" aria-label="Close menu" className="flex h-8 w-9 items-center justify-center rounded-md border border-line">
                <span className="relative block size-4">
                  <span className="absolute top-1/2 left-0 h-px w-4 rotate-45 bg-ink" />
                  <span className="absolute top-1/2 left-0 h-px w-4 -rotate-45 bg-ink" />
                </span>
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="All pages" className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <ul>
              {NAV_ITEMS.map((item, index) => (
                <motion.li
                  key={item.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.04 * index }}
                  className="border-b border-line"
                >
                  <Link
                    to={item.to}
                    search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                    className="group flex items-baseline gap-4 py-3.5"
                  >
                    <span className="w-6 font-mono text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
                    <span
                      className={cn(
                        "t-display text-[2rem] leading-none",
                        isNavActive(pathname, item.to) ? "text-signal" : "text-ink",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>
          <div className="grid grid-cols-2 gap-px border-t border-line bg-line pb-[env(safe-area-inset-bottom,0px)]">
            <div className="bg-canvas px-5 py-4">
              <p className="t-label">Passport</p>
              <p className="mt-1 truncate text-sm text-ink">
                {profile ? `@${profile.username}` : sessionAddress ? "Signed in, not saved" : "Not signed in"}
              </p>
            </div>
            <div className="bg-canvas px-5 py-4">
              <p className="t-label">Wallet</p>
              <p className="mt-1 truncate font-mono text-sm text-ink">
                {isConnected && address ? `${shortAddress(address)} · ${network.label}` : "Not connected"}
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
