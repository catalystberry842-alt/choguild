import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function NotFoundState() {
  return (
    <EmptyState
      title="This page does not exist"
      body="That address does not match Home, Passport, Discover, or Submissions."
      action={
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      }
    />
  );
}
