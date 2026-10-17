import { createFileRoute } from "@tanstack/react-router";
import { isAvatarId } from "@/lib/passport/avatar";

/** Serves an uploaded passport avatar. Ids are random and content never changes, so it caches for a year. */
export const Route = createFileRoute("/api/avatar/$avatarId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.avatarId;
        if (!isAvatarId(id)) return new Response("Not found", { status: 404 });
        const etag = `"${id}"`;
        const cache = "public, max-age=31536000, s-maxage=31536000, immutable";
        if (request.headers.get("if-none-match") === etag) {
          return new Response(null, { status: 304, headers: { etag, "cache-control": cache } });
        }
        const [{ getSql }, { readAvatar }] = await Promise.all([import("@/lib/db"), import("@/lib/passport/avatar.server")]);
        const avatar = await readAvatar(await getSql(), id);
        if (!avatar) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
        return new Response(avatar.bytes as BodyInit, {
          headers: {
            "content-type": avatar.type,
            "content-length": String(avatar.bytes.length),
            "cache-control": cache,
            etag,
            "x-content-type-options": "nosniff",
            "content-security-policy": "default-src 'none'; sandbox",
          },
        });
      },
    },
  },
});
