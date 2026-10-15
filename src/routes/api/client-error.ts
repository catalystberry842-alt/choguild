import { createFileRoute } from "@tanstack/react-router";
import { takeToken } from "@/lib/rate-limit";

export const Route = createFileRoute("/api/client-error")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        if (!takeToken(`client-error:${ip}`, 10, 60_000)) return new Response(null, { status: 429 });
        const text = (await request.text()).slice(0, 4_000);
        try {
          const report = JSON.parse(text) as Record<string, unknown>;
          console.error("[client-error]", JSON.stringify({
            message: String(report.message ?? "").slice(0, 500),
            source: String(report.source ?? "").slice(0, 40),
            path: String(report.path ?? "").slice(0, 200),
            stack: String(report.stack ?? "").slice(0, 2_000),
            ua: String(report.ua ?? "").slice(0, 200),
          }));
        } catch {
          return new Response(null, { status: 400 });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
