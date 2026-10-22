import { createServerFn } from "@tanstack/react-start";

export const getNotices = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveViewer } = await import("@/lib/chog/actor.server");
  const { noticesFor } = await import("./repo.server");
  const viewer = await resolveViewer();
  if (!viewer.actor) return null;
  return noticesFor(viewer.sql, viewer.actor);
});
