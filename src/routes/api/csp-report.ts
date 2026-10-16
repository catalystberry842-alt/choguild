import { createFileRoute } from "@tanstack/react-router";
import { takeToken } from "@/lib/rate-limit";

/** Receives CSP violation reports (report-uri and Reporting API) and logs a trimmed copy. */
export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        if (!takeToken(`csp:${ip}`, 20, 60_000)) return new Response(null, { status: 429 });
        const text = (await request.text()).slice(0, 8_000);
        try {
          const parsed = JSON.parse(text) as unknown;
          const reports = Array.isArray(parsed) ? parsed.map((r) => (r as { body?: unknown }).body ?? r) : [(parsed as { "csp-report"?: unknown })["csp-report"] ?? parsed];
          for (const report of reports.slice(0, 5)) {
            const r = report as Record<string, unknown>;
            console.warn("[csp-report]", JSON.stringify({
              directive: String(r["effective-directive"] ?? r.effectiveDirective ?? r["violated-directive"] ?? "").slice(0, 80),
              blocked: String(r["blocked-uri"] ?? r.blockedURL ?? "").slice(0, 300),
              page: String(r["document-uri"] ?? r.documentURL ?? "").slice(0, 300),
            }));
          }
        } catch {
          return new Response(null, { status: 400 });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
