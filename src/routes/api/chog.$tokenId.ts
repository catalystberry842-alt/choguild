import { createFileRoute } from "@tanstack/react-router";
import { isChogTokenId } from "@/lib/chog/chog";

const GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/"];

/** Serves a Chog Genesis token image from IPFS; immutable, so the Vercel edge caches it for a year. */
export const Route = createFileRoute("/api/chog/$tokenId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const tokenId = Number(params.tokenId);
        if (!isChogTokenId(tokenId)) return new Response("Not found", { status: 404 });
        const { chogImagePath } = await import("@/lib/chog/holders.server");
        const path = await chogImagePath(tokenId).catch(() => null);
        if (!path) return new Response("Unavailable", { status: 502, headers: { "cache-control": "no-store" } });
        for (const gateway of GATEWAYS) {
          try {
            const upstream = await fetch(gateway + path, { signal: AbortSignal.timeout(15_000) });
            const type = upstream.headers.get("content-type") ?? "";
            if (!upstream.ok || !type.startsWith("image/")) continue;
            return new Response(upstream.body, {
              headers: {
                "content-type": type,
                "cache-control": "public, max-age=604800, s-maxage=31536000, immutable",
              },
            });
          } catch {
            // try the next gateway
          }
        }
        return new Response("Unavailable", { status: 502, headers: { "cache-control": "no-store" } });
      },
    },
  },
});
