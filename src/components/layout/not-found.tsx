import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { emptyBoardSearch } from "@/lib/board/search";

export function NotFoundState() {
  return (
    <PageHeader
      eyebrow="404"
      title="Page not found"
      description="That link doesn't lead anywhere. It may have moved, or it never existed."
      actions={
        <>
          <Button asChild size="compact">
            <Link to="/">Go home</Link>
          </Button>
          <Button asChild variant="secondary" size="compact">
            <Link to="/discover" search={emptyBoardSearch()}>Browse work</Link>
          </Button>
        </>
      }
    />
  );
}
