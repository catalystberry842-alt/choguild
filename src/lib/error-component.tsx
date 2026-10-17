import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/report-error";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  useEffect(() => reportError(error, "route"), [error]);
  return (
    <main className="relative z-10 mx-auto flex min-h-[70dvh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="passport-glass w-full rounded-[1.75rem] px-6 py-10 sm:px-8">
        <TriangleAlert className="mx-auto size-9 text-danger" aria-hidden="true" />
        <h1 className="t-h2 mt-5">Something went <em>wrong</em></h1>
        <p className="t-body mt-3 break-words text-pretty">{errorMessage(error)}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
