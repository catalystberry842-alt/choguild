/** Lightweight client error reporting: errors go to /api/client-error and land in the server logs. */
let sent = 0;

export function reportError(error: unknown, source: string) {
  if (typeof window === "undefined" || sent >= 5) return;
  sent += 1;
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
  const body = JSON.stringify({
    message: err.message.slice(0, 500),
    stack: (err.stack ?? "").slice(0, 2_000),
    source,
    path: window.location.pathname,
    ua: navigator.userAgent.slice(0, 200),
  });
  try {
    if (!navigator.sendBeacon?.("/api/client-error", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/client-error", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {
    // Reporting must never break the page.
  }
}

let installed = false;
export function installErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => reportError(event.error ?? event.message, "window.error"));
  window.addEventListener("unhandledrejection", (event) => reportError(event.reason, "unhandledrejection"));
}
