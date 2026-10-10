import { Link, useRouterState } from "@tanstack/react-router";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export function PrimaryNav({
  onNavigate,
  layout = "stack",
}: {
  onNavigate?: () => void;
  layout?: "stack" | "row";
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Primary">
      <ul className={layout === "row" ? "flex items-center gap-1" : "flex flex-col gap-1"}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: true }}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors duration-150",
                  active
                    ? "bg-elevated text-ink shadow-[inset_3px_0_0_0_#7C3AED]"
                    : "text-body hover:bg-elevated hover:text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
