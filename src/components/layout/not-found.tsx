import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { emptyBoardSearch } from "@/lib/board/search";

/** 404 state: oversized numeral and a short left-aligned message, real h1, robots noindex (React 19 hoists the meta into <head>). */
export function NotFoundState({
  title = "Page not found",
  description = "That link doesn't lead anywhere. It may have moved, or it never existed.",
  actions,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <meta name="robots" content="noindex" />
      <div className="grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <p aria-hidden="true" className="t-display leading-none font-medium tracking-[-0.07em] text-line-strong">404</p>
        <div className="max-w-md">
          <p className="t-kicker">Not found</p>
          <h1 className="t-title mt-4">{title}</h1>
          <p className="t-lead mt-4 text-pretty">{description}</p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {actions ?? (
              <>
                <Button asChild>
                  <Link to="/">Go home</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/discover" search={emptyBoardSearch()}>
                    Browse work
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
