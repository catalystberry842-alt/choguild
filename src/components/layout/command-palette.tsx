import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { Briefcase, FilePlus2, Megaphone, Search, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { emptyBoardSearch } from "@/lib/board/search";
import { NAV_ITEMS } from "@/lib/navigation";

type Action = { label: string; hint: string; icon: LucideIcon; go: (navigate: ReturnType<typeof useNavigate>) => void };

const ACTIONS: Action[] = [
  {
    label: "Publish an opportunity",
    hint: "Post open work to the board",
    icon: Megaphone,
    go: (navigate) => navigate({ to: "/opportunities/new" }),
  },
  {
    label: "Your opportunities",
    hint: "Listings you have published",
    icon: Briefcase,
    go: (navigate) => navigate({ to: "/opportunities" }),
  },
  {
    label: "New submission",
    hint: "Send evidence for accepted work",
    icon: FilePlus2,
    go: (navigate) => navigate({ to: "/submissions/new" }),
  },
];

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-body data-[selected=true]:bg-action/20 data-[selected=true]:text-ink";

/** Global ⌘K / Ctrl+K jump menu. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function run(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-scrim/70 backdrop-blur-sm" />
        <Dialog.Content className="rise fixed top-[12vh] right-4 left-4 z-50 mx-auto max-w-lg overflow-hidden rounded-2xl border border-line bg-elevated shadow-[0_30px_80px_-20px_rgb(139_92_246_/_0.5)]">
          <Dialog.Title className="sr-only">Jump to</Dialog.Title>
          <Dialog.Description className="sr-only">Search pages and actions.</Dialog.Description>
          <Command label="Jump to" loop>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="size-4 text-muted" aria-hidden="true" />
              <Command.Input
                autoFocus
                placeholder="Where to?"
                className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
              />
              <kbd className="rounded border border-line px-1.5 text-[11px] text-muted">Esc</kbd>
            </div>
            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted">Nothing matches.</Command.Empty>
              <Command.Group heading="Pages" className="text-xs text-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.to}
                      value={item.label}
                      onSelect={() =>
                        run(() =>
                          item.to === "/discover"
                            ? navigate({ to: "/discover", search: emptyBoardSearch() })
                            : navigate({ to: item.to }),
                        )
                      }
                      className={itemClass}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Command.Item>
                  );
                })}
              </Command.Group>
              <Command.Group heading="Actions" className="mt-1 text-xs text-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Command.Item
                      key={action.label}
                      value={`${action.label} ${action.hint}`}
                      onSelect={() => run(() => action.go(navigate))}
                      className={itemClass}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span className="flex-1">{action.label}</span>
                      <span className="hidden text-xs text-muted sm:inline">{action.hint}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
