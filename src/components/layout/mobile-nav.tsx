import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { AccountPanel } from "@/components/layout/account-panel";
import { PrimaryNav } from "@/components/layout/primary-nav";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="icon" className="size-9 lg:hidden" aria-label="Open menu">
          <Menu className="size-4" aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/80" />
        <Dialog.Content className="rise fixed inset-y-0 left-0 z-50 flex w-full max-w-72 flex-col gap-6 overflow-y-auto border-r border-line bg-sidebar p-4">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-sm font-medium text-ink">Menu</Dialog.Title>
            <Dialog.Description className="sr-only">
              Primary navigation, wallet, and account.
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button variant="ghost" className="px-3" aria-label="Close menu">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="w-24">
            <Logo onClick={() => setOpen(false)} />
          </div>
          <PrimaryNav onNavigate={() => setOpen(false)} />
          <div className="mt-auto">
            <AccountPanel onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
