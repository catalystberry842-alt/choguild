import * as Dialog from "@radix-ui/react-dialog";
import { Link, useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Search, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { WalletPanel } from "@/components/passport/wallet-panel";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/passport/format";

export function TopBar({ title, onOpenPalette }: { title: string; onOpenPalette: () => void }) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Detail and form pages (`/discover/abc`, `/submissions/new`) get a back control.
  const nested = pathname.split("/").filter(Boolean).length > 1;

  return (
    <header className="glass sticky top-0 z-30 border-b border-line">
      <div className="h-[env(safe-area-inset-top,0px)]" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Choguild home">
          <img src="/brand/choguild-mark.jpg" alt="" width={36} height={36} className="size-9 rounded-xl" />
          <span className="hidden text-[17px] font-bold tracking-tight text-ink sm:inline">Choguild</span>
        </Link>
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
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button size="compact">
                {isConnected && address ? (
                  <span className="pulse-dot size-2 rounded-full bg-success" aria-hidden="true" />
                ) : (
                  <Wallet className="size-4" aria-hidden="true" />
                )}
                {isConnected && address ? shortAddress(address) : "Wallet"}
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/80" />
              <Dialog.Content className="fixed top-1/2 right-4 left-4 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-line bg-elevated p-5">
                <Dialog.Title className="text-lg font-semibold text-ink">Wallet</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-body">
                  Connect a browser wallet. A connection is not a passport session until you sign.
                </Dialog.Description>
                <div className="mt-4">
                  <WalletPanel />
                </div>
                <div className="mt-4 flex justify-end">
                  <Dialog.Close asChild>
                    <Button variant="secondary">Close</Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
