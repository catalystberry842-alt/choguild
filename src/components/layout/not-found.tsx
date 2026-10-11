import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function NotFoundState() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Button asChild variant="secondary" size="compact">
          <Link to="/">Go home</Link>
        </Button>
      }
    />
  );
}
