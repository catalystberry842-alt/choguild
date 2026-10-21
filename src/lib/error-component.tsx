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
    <main className="relative z-10 mx-auto flex min-h-[70dvh] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
      <div className="max-w-xl border-l border-danger/50 pl-6">
        <p className="t-kicker flex items-center gap-2 text-danger"><TriangleAlert className="size-3.5" aria-hidden="true" /> Error</p>
        <h1 className="t-title mt-4">Something went <em>wrong.</em></h1>
        <p className="t-body mt-4 break-words text-pretty">{errorMessage(error)}</p>
        <div className="mt-8 flex flex-wrap gap-2">
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
