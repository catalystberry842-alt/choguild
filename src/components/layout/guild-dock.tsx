import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, ChevronRight, LayoutGrid, Megaphone, UserRound, X, type LucideIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { usePassport } from "@/components/passport/passport-provider";
import { cn } from "@/lib/cn";
import { NAV_ITEMS, isNavActive } from "@/lib/navigation";
import { monadChainLabel } from "@/lib/passport/chain";
import { shortAddress } from "@/lib/passport/format";
import { useMeasuredHeight } from "@/lib/use-measure";

type PanelId = "more" | "account";

const PANELS: { id: PanelId; label: string; icon: LucideIcon }[] = [
  { id: "more", label: "More", icon: LayoutGrid },
  { id: "account", label: "Account", icon: UserRound },
];

const TABS = NAV_ITEMS.filter((item) => item.dock);
const MORE_LINKS = NAV_ITEMS.filter((item) => !item.dock);

const SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

/**
 * Floating navigation dock. Collapsed it is a pill of page tabs; opening a
 * panel morphs it into a card whose height follows the panel's content.
 */
export function GuildDock() {
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [direction, setDirection] = useState(1);
  const [contentRef, contentHeight] = useMeasuredHeight<HTMLDivElement>();
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Any navigation closes the dock.
  useEffect(() => setPanel(null), [pathname]);

  useEffect(() => {
    if (!panel) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPanel(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  function toggle(id: PanelId) {
    if (panel && panel !== id) {
      const order = PANELS.map((item) => item.id);
      setDirection(order.indexOf(id) > order.indexOf(panel) ? 1 : -1);
    } else {
      setDirection(1);
    }
    setPanel((current) => (current === id ? null : id));
  }

  return (
    <MotionConfig transition={SPRING} reducedMotion="user">
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <motion.nav
          ref={rootRef}
          aria-label="Primary"
          layout
          style={{ borderRadius: 28 }}
          className={cn(
            "pointer-events-auto w-full overflow-hidden border border-line bg-canvas/95 shadow-[0_10px_40px_-12px_rgb(0_0_0_/_0.45)] backdrop-blur-xl",
            panel ? "max-w-[400px]" : "max-w-fit",
          )}
        >
          <motion.div
            initial={false}
            animate={{ height: panel ? contentHeight : 0 }}
            className="overflow-hidden"
            aria-hidden={!panel}
          >
            <div ref={contentRef} id="dock-panel">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                {panel ? (
                  <motion.div
                    key={panel}
                    custom={direction}
                    variants={{
                      enter: (dir: number) => ({ x: dir * 32, opacity: 0, filter: "blur(4px)" }),
                      center: { x: 0, opacity: 1, filter: "blur(0px)" },
                      exit: (dir: number) => ({ x: dir * -32, opacity: 0, filter: "blur(4px)" }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="p-5 pb-3"
                  >
                    <PanelHeader title={panel === "more" ? "More" : "Account"} onClose={() => setPanel(null)} />
                    {panel === "more" ? <MorePanel /> : <AccountPanel />}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div layout="position" className="flex items-center gap-1 p-1.5">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = !panel && isNavActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  aria-current={isNavActive(pathname, item.to) ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors",
                    active ? "px-4 text-canvas" : "w-11 text-muted hover:text-ink",
                  )}
                >
                  {active ? <motion.span layoutId="dock-active" className="absolute inset-0 rounded-full bg-ink" /> : null}
                  <Icon className="relative size-[18px] shrink-0" aria-hidden="true" />
                  {active ? (
                    <motion.span
                      className="relative whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </Link>
              );
            })}
            <span className="mx-1 h-6 w-px bg-line" aria-hidden="true" />
            {PANELS.map((item) => {
              const Icon = item.icon;
              const open = panel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-label={item.label}
                  aria-expanded={open}
                  aria-controls="dock-panel"
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-full transition-colors",
                    open ? "text-canvas" : "text-muted hover:text-ink",
                  )}
                >
                  {open ? <motion.span layoutId="dock-active" className="absolute inset-0 rounded-full bg-ink" /> : null}
                  <Icon className="relative size-[18px]" aria-hidden="true" />
                </button>
              );
            })}
          </motion.div>
        </motion.nav>
      </div>
    </MotionConfig>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-base font-semibold tracking-tight text-ink">{title}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-secondary hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 px-1 text-[11px] font-medium tracking-wider text-muted uppercase">{children}</p>;
}

const QUICK_ACTIONS = [
  { to: "/opportunities/new", label: "Publish work", icon: Megaphone },
  { to: "/opportunities", label: "Your listings", icon: Briefcase },
] as const;

const WHATS_NEW = [
  { title: "The Chog ladder", body: "Earn XP from accepted work and climb five ranks." },
  { title: "Light mode", body: "Switch themes from the header any time." },
  { title: "Skill filters fixed", body: "Filtering the board by skill now works." },
] as const;

function MorePanel() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2">
        {MORE_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-3.5 transition-colors hover:border-muted"
            >
              <Icon className="size-[18px] text-muted" aria-hidden="true" />
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div>
        <SectionLabel>Quick actions</SectionLabel>
        <div className="flex flex-col">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 rounded-xl px-1 py-2.5 text-sm text-ink transition-colors hover:bg-secondary"
              >
                <Icon className="size-4 text-muted" aria-hidden="true" />
                <span className="flex-1">{action.label}</span>
                <ChevronRight className="size-4 text-muted" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>What&apos;s new</SectionLabel>
        <ul className="flex flex-col gap-3 px-1">
          {WHATS_NEW.map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-ink">{item.title}</span>
                <span className="block text-xs leading-5 text-body">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AccountPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { profile, sessionAddress, status } = usePassport();
  const network = monadChainLabel(isConnected ? chainId : undefined);
  const name = profile?.displayName ?? (sessionAddress ? shortAddress(sessionAddress) : "Guest");
  const detail =
    status === "loading"
      ? "Checking session"
      : profile
        ? `@${profile.username}`
        : sessionAddress
          ? "Signed in, passport not saved"
          : "No passport session";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-ink ring-1 ring-line" aria-hidden="true">
          {profile ? (
            <span className="text-lg font-semibold">{profile.displayName.slice(0, 1).toUpperCase()}</span>
          ) : (
            <UserRound className="size-5" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{name}</p>
          <p className="text-sm text-muted">{detail}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-line bg-elevated p-3.5">
          <dt className="text-xs text-muted">Wallet</dt>
          <dd className={cn("mt-1 truncate text-sm text-ink", isConnected && address && "font-mono")}>{isConnected && address ? shortAddress(address) : "Not connected"}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-elevated p-3.5">
          <dt className="text-xs text-muted">Network</dt>
          <dd className="mt-1 truncate text-sm text-ink">{isConnected ? network.label : "—"}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <Link
          to="/passport"
          className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
        >
          {profile ? "Edit passport" : "Open passport"}
        </Link>
        {profile ? (
          <Link
            to="/passport/$username"
            params={{ username: profile.username }}
            className="flex h-11 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink transition-colors hover:border-muted"
          >
            View public page
          </Link>
        ) : (
          <p className="text-center text-xs leading-5 text-muted">
            Connect with Wallet in the header, then sign to open a session.
          </p>
        )}
      </div>
    </div>
  );
}
