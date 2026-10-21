import * as Dialog from "@radix-ui/react-dialog";
import { Wallet } from "lucide-react";
import { useWalletState } from "@/components/passport/wallet-state";
import { LazyWalletPanel } from "@/components/passport/lazy-wallet-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { shortAddress } from "@/lib/passport/format";

/**
 * Opens the wallet dialog (connect, switch, disconnect). Shared by the app
 * header and the landing nav so both use the same connection flow.
 */
export function WalletButton({
  label = "Connect wallet",
  compactLabel = "Connect",
  className,
}: {
  label?: string;
  /** Shorter label below the `sm` breakpoint. */
  compactLabel?: string;
  className?: string;
}) {
  const { address, isConnected } = useWalletState();
  const connected = isConnected && address;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="compact" className={className}>
          {connected ? (
            <span className="pulse-dot size-2 rounded-full bg-success" aria-hidden="true" />
          ) : (
            <Wallet className="size-4" aria-hidden="true" />
          )}
          {connected ? (
            shortAddress(address)
          ) : compactLabel ? (
            <>
              <span className="sm:hidden">{compactLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : (
            label
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/80" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 right-4 left-4 z-50 mx-auto max-w-md -translate-y-1/2 glass glass-strong rounded-2xl p-0",
          )}
        >
          <div className="border-b border-line px-6 pt-6 pb-5">
            <p className="t-kicker">Monad mainnet</p>
            <Dialog.Title className="t-h2 mt-2">Wallet</Dialog.Title>
            <Dialog.Description className="mt-2 text-small text-body">
              Connect a browser wallet. A connection is not a passport session until you sign.
            </Dialog.Description>
          </div>
          <div className="px-6 py-6">
            <LazyWalletPanel />
          </div>
          <div className="flex justify-end border-t border-line px-6 py-4">
            <Dialog.Close asChild>
              <Button variant="secondary" size="compact">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
