import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WalletPanel } from "@/components/passport/wallet-panel";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/passport/format";

export function TopBar({ title }: { title: string }) {
  const { address, isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="h-[env(safe-area-inset-top,0px)]" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-6">
        <MobileNav />
        <Logo className="w-9 shrink-0 lg:hidden" />
        <p className="hidden min-w-0 flex-1 truncate text-sm font-semibold text-ink lg:block">{title}</p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button asChild variant="secondary" size="compact" className="hidden sm:inline-flex">
            <Link to="/passport">Passport</Link>
          </Button>
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button size="compact">{isConnected && address ? shortAddress(address) : "Wallet"}</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/40" />
              <Dialog.Content className="fixed top-1/2 right-4 left-4 z-50 mx-auto max-w-md -translate-y-1/2 rounded-lg border border-line bg-elevated p-5">
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
