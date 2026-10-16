import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { emptyBoardSearch } from "@/lib/board/search";

/** 404 state: real h1, and robots noindex (React 19 hoists the meta into <head>). */
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
      <PageHeader
        eyebrow="404"
        title={title}
        description={description}
        actions={
          actions ?? (
            <>
              <Button asChild size="compact">
                <Link to="/">Go home</Link>
              </Button>
              <Button asChild variant="secondary" size="compact">
                <Link to="/discover" search={emptyBoardSearch()}>Browse work</Link>
              </Button>
            </>
          )
        }
      />
    </>
  );
}
