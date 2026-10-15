import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const FALLBACK_MESSAGE = "An unexpected error occurred.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

/**
 * Shown when a route throws. Keeps the real message visible and always offers
 * a way forward: retry (re-runs the route's loader) or go home.
 */
export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div role="alert" className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-danger/10 ring-1 ring-danger/25">
        <TriangleAlert className="size-5 text-danger" aria-hidden="true" />
      </span>
      <h1 className="t-h2">Something went wrong</h1>
      <p className="t-body max-w-md break-words">{errorMessage(error)}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button
          size="compact"
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="secondary" size="compact">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
