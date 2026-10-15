import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Whole-page "nothing here" state. Always offers a way forward (home by default). */
export function NotFoundState({
  title = "Page not found",
  body = "The link may be old, or the page moved.",
  action,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      as="h1"
      title={title}
      body={body}
      action={
        action ?? (
          <Button asChild variant="secondary" size="compact">
            <Link to="/">Go home</Link>
          </Button>
        )
      }
    />
  );
}
