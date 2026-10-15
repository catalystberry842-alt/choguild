import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { WalletButton } from "@/components/passport/wallet-button";
import { emptyBoardSearch } from "@/lib/board/search";

const PRIMARY = [
  { to: "/discover", label: "Discover" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/passport", label: "Chog Passport" },
] as const;

const SECONDARY = [
  { to: "/ranking", label: "Ranking" },
  { to: "/submissions", label: "Submissions" },
  { to: "/applications", label: "Applications" },
  { to: "/network", label: "Network" },
] as const;

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex shrink-0 items-center gap-2.5 rounded-full pr-1" aria-label="Choguild home">
      <img src="/brand/choguild-mark.jpg" alt="" width={32} height={32} className="size-8 rounded-[9px]" />
      <span className="text-[15px] font-semibold tracking-tight text-ink">Choguild</span>
    </Link>
  );
}

/** Floating navigation for the landing page; the app shell's header takes over on inner pages. */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:px-6 sm:pt-[calc(env(safe-area-inset-top,0px)+20px)]">
      <nav
        aria-label="Main"
        className="landing-glass pointer-events-auto mx-auto flex h-14 w-full max-w-[640px] items-center gap-2 rounded-2xl px-2.5 pl-3 sm:w-fit sm:gap-1 sm:pl-2.5"
      >
        <Brand />

        <ul className="ml-3 hidden items-center gap-0.5 md:flex">
          {PRIMARY.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                className="rounded-lg px-3 py-2 text-[14px] text-body transition-colors hover:text-ink"
                activeProps={{ className: "text-ink" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 md:ml-3">
          <WalletButton label="Connect wallet" compactLabel="Connect" className="h-9 min-h-9 rounded-xl border border-line bg-white/[0.07] px-3.5 font-medium text-ink hover:bg-white/[0.12]" />
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="flex size-9 items-center justify-center rounded-xl text-body transition-colors hover:bg-white/5 hover:text-ink md:hidden"
              >
                <Menu className="size-[18px]" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
              <Dialog.Content className="landing rise fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+12px)] z-50 rounded-2xl border border-line p-3">
                <div className="flex h-11 items-center justify-between pl-1">
                  <Brand onClick={() => setOpen(false)} />
                  <Dialog.Title className="sr-only">Menu</Dialog.Title>
                  <Dialog.Description className="sr-only">All Choguild pages.</Dialog.Description>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="flex size-9 items-center justify-center rounded-xl text-body hover:bg-white/5 hover:text-ink"
                    >
                      <X className="size-[18px]" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>
                <ul className="mt-3 flex flex-col">
                  {[...PRIMARY, ...SECONDARY].map((item, index) => (
                    <li key={item.to} className={index === PRIMARY.length ? "mt-2 border-t border-line pt-2" : ""}>
                      <Link
                        to={item.to}
                        search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] text-ink hover:bg-white/5"
                      >
                        {item.label}
                        <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </nav>
    </header>
  );
}
