import { createServerFn } from "@tanstack/react-start";

export const getRanking = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const { listContributors, loadGuildStats } = await import("./repo.server");
  const { loadTxCounts } = await import("@/lib/monad/activity.server");
  const { onchainXpFor } = await import("./xp");
  const { holdingsFor } = await import("@/lib/chog/holders.server");
  const { chogBonusFor } = await import("@/lib/chog/chog");
  const sql = await getSql();
  const [people, stats] = await Promise.all([listContributors(sql), loadGuildStats(sql)]);

  const wallets = people.map((person) => person.wallet);
  const [txCounts, holdings] =
    people.length > 0
      ? await Promise.all([loadTxCounts(wallets), holdingsFor(wallets)])
      : [new Map<string, number>(), new Map()];
  const contributors = people.map((person) => {
    const chog = holdings?.get(person.wallet) ?? null;
    const chogBonus = chogBonusFor(person.guildXp, (chog?.count ?? 0) > 0);
    const boosted = { ...person, chog, chogBonus, guildXp: person.guildXp + chogBonus };
    const txCount = txCounts.get(person.wallet);
    return txCount === undefined ? boosted : { ...boosted, txCount, onchainXp: onchainXpFor(txCount) };
  });
  const onchainAvailable = people.length === 0 || contributors.some((person) => person.txCount !== null);
  const onchainTxs = contributors.reduce((total, person) => total + (person.txCount ?? 0), 0);

  return { contributors, stats: { ...stats, onchainTxs }, onchainAvailable };
});
