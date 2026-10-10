import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS, isNavActive } from "@/lib/navigation";
import { cn } from "@/lib/cn";

const TABS = NAV_ITEMS.filter((item) => item.tab);

/** Thumb-reach navigation for phones and tablets; the sidebar takes over at `lg`. */
export function BottomTabs() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label="Tabs"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                  active ? "text-ink" : "text-muted hover:text-body",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active ? "bg-action/25 text-sand scale-100" : "scale-90",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="max-w-full truncate px-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
