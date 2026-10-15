import { createFileRoute } from "@tanstack/react-router";

const ORIGIN = "https://choguild.vercel.app";
const STATIC_PATHS = ["/", "/discover", "/ranking", "/network", "/how-it-works", "/passport"];

function escape(value: string) {
  return value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls: { loc: string; lastmod?: string }[] = STATIC_PATHS.map((path) => ({ loc: `${ORIGIN}${path}` }));
        try {
          const { getSql } = await import("@/lib/db");
          const sql = await getSql();
          const opps = await sql.query<{ id: string; updated_at: string | Date }>(
            "select id, updated_at from opportunities where status <> 'draft' order by updated_at desc limit 1000",
          );
          for (const row of opps) urls.push({ loc: `${ORIGIN}/discover/${row.id}`, lastmod: new Date(row.updated_at).toISOString() });
          const people = await sql.query<{ username: string; updated_at: string | Date }>(
            "select username, updated_at from contributor_profiles where visibility = 'public' order by updated_at desc limit 1000",
          );
          for (const row of people) urls.push({ loc: `${ORIGIN}/passport/${row.username}`, lastmod: new Date(row.updated_at).toISOString() });
        } catch {
          // Database unavailable: still serve the static pages.
        }
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${escape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(body, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600" },
        });
      },
    },
  },
});
