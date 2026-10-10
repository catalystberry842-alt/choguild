import { createServerFn } from "@tanstack/react-start";

export const getRanking = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const { listRanking, loadGuildStats } = await import("./repo.server");
  const sql = await getSql();
  const [ranking, stats] = await Promise.all([listRanking(sql), loadGuildStats(sql)]);
  return { ranking, stats };
});
