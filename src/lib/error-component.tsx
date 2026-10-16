import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center text-ink">
      <TriangleAlert className="size-8 text-danger" aria-hidden="true" />
      <h1 className="t-h3">Something went wrong</h1>
      <p className="max-w-md text-base break-words text-body">{errorMessage(error)}</p>
    </main>
  );
}
