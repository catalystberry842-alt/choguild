import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";
import { Button } from "@/components/ui/button";
import { emptyBoardSearch } from "@/lib/board/search";

/** 404 state: glass card, real h1, robots noindex (React 19 hoists the meta into <head>). */
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
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10 text-center sm:py-16">
        <div className="passport-glass w-full rounded-[1.75rem] px-6 py-10 sm:px-10 sm:py-12">
          <AnimatedMark size={56} className="mx-auto text-ink" />
          <p className="t-meta mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-black/20 px-3 py-1">
            <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
            404
          </p>
          <h1 className="t-title mt-5 tracking-tight">{title}</h1>
          <p className="t-lead mt-4 text-pretty">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
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
