import { createFileRoute } from "@tanstack/react-router";
import { AVATAR_MAX_BYTES, checkAvatarUpload } from "@/lib/passport/avatar";
import { takeToken } from "@/lib/rate-limit";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/**
 * POST the browser-compressed avatar as the raw request body. Only a signed-in
 * passport wallet may upload; the bytes are size-capped and type-sniffed here.
 */
export const Route = createFileRoute("/api/avatar-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { liveSessionWallet } = await import("@/lib/passport/state.server");
        let wallet: string | null;
        try {
          wallet = await liveSessionWallet();
        } catch (error) {
          return json({ ok: false, error: error instanceof Error ? error.message : "Request blocked." }, 403);
        }
        if (!wallet) return json({ ok: false, error: "Sign in with your wallet before uploading an avatar." }, 401);
        if (!takeToken(`avatar:${wallet}`, 12, 10 * 60_000)) {
          return json({ ok: false, error: "Too many uploads. Wait a few minutes and try again." }, 429);
        }
        const declared = Number(request.headers.get("content-length") ?? "0");
        if (declared > AVATAR_MAX_BYTES) return json({ ok: false, error: "That image is too large." }, 413);
        const bytes = new Uint8Array(await request.arrayBuffer());
        const checked = checkAvatarUpload(bytes);
        if (!checked.ok) return json({ ok: false, error: checked.error }, checked.status);
        const [{ getSql }, { storeAvatar }] = await Promise.all([import("@/lib/db"), import("@/lib/passport/avatar.server")]);
        const stored = await storeAvatar(await getSql(), wallet, bytes, checked.type);
        return json({ ok: true, url: stored.url });
      },
    },
  },
});
