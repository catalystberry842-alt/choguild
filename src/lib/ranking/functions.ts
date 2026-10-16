import { createServerFn } from "@tanstack/react-start";

export const getRanking = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const { listContributors, loadGuildStats } = await import("./repo.server");
  const { loadTxCounts, txCountStore } = await import("@/lib/monad/activity.server");
  const { onchainXpFor } = await import("./xp");
  const { holdingsFor } = await import("@/lib/chog/holders.server");
  const { chogBonusFor } = await import("@/lib/chog/chog");
  const sql = await getSql();
  const [people, stats] = await Promise.all([listContributors(sql), loadGuildStats(sql)]);

  const wallets = people.map((person) => person.wallet);
  const [txCounts, holdings] =
    people.length > 0
      ? await Promise.all([
          // Never block the page on the chain: persisted counts/snapshot first, short budget for the rest.
          loadTxCounts(wallets, { store: txCountStore(sql), budgetMs: 1_500 }),
          holdingsFor(wallets, { budgetMs: 1_500 }),
        ])
      : [new Map<string, number>(), new Map()];
  const contributors = people.map((person) => {
    const chog = holdings?.get(person.wallet) ?? null;
    const chogBonus = chogBonusFor(person.guildXp, (chog?.count ?? 0) > 0);
    const boosted = { ...person, chog, chogBonus, guildXp: person.guildXp + chogBonus };
    const txCount = txCounts.get(person.wallet);
    return txCount === undefined ? boosted : { ...boosted, txCount, onchainXp: onchainXpFor(txCount) };
  });
  const onchainAvailable = people.length === 0 || contributors.some((person) => person.txCount !== null);
  // Null (rendered "unavailable") when the RPC could not answer, never a misleading 0.
  const onchainTxs = onchainAvailable ? contributors.reduce((total, person) => total + (person.txCount ?? 0), 0) : null;

  return { contributors, stats: { ...stats, onchainTxs }, onchainAvailable };
});
