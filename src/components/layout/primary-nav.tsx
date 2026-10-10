import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS, isNavActive } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export function PrimaryNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-semibold transition-all duration-200",
                  active
                    ? "bg-elevated text-ink"
                    : "text-body hover:translate-x-0.5 hover:bg-elevated hover:text-ink",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-2 left-0 w-1 rounded-r-full bg-action transition-transform duration-300",
                    active ? "scale-y-100" : "scale-y-0",
                  )}
                />
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                    active && "text-ink",
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
