import { createServerFn } from "@tanstack/react-start";

export const getRanking = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const { listContributors, loadGuildStats } = await import("./repo.server");
  const { loadTxCounts } = await import("@/lib/monad/activity.server");
  const { onchainXpFor } = await import("./xp");
  const sql = await getSql();
  const [people, stats] = await Promise.all([listContributors(sql), loadGuildStats(sql)]);

  const txCounts = people.length > 0 ? await loadTxCounts(people.map((person) => person.wallet)) : new Map<string, number>();
  const contributors = people.map((person) => {
    const txCount = txCounts.get(person.wallet);
    return txCount === undefined ? person : { ...person, txCount, onchainXp: onchainXpFor(txCount) };
  });
  const onchainAvailable = people.length === 0 || contributors.some((person) => person.txCount !== null);
  const onchainTxs = contributors.reduce((total, person) => total + (person.txCount ?? 0), 0);

  return { contributors, stats: { ...stats, onchainTxs }, onchainAvailable };
});
