import { motion } from "motion/react";
import { LogoMark } from "@/components/brand/logo";
import { formatDay, shortAddress } from "@/lib/passport/format";
import type { PublicProfile } from "@/lib/passport/types";

/** The passport as a printed record: ruled fields, mono values, only real state. */
export function PassportRecord({ profile, address }: { profile: PublicProfile | null; address: string | null }) {
  const wallet = profile?.walletAddress ?? address;
  const status = profile ? "Member" : address ? "Signed in · not saved" : "Unclaimed";
  const fields: [string, string][] = [
    ["Holder", profile ? profile.displayName : "—"],
    ["Handle", profile ? `@${profile.username}` : "—"],
    ["Wallet", wallet ? shortAddress(wallet) : "Not connected"],
    ["Issued", profile ? formatDay(profile.createdAt) : "—"],
    ["Skills", profile && profile.skills.length > 0 ? profile.skills.slice(0, 4).join(", ") : "—"],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative overflow-hidden rounded-[1.25rem] border border-line-strong bg-elevated"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <LogoMark className="size-3.5 text-ink" /> Choguild passport
        </span>
        <span className={"font-mono text-[10px] tracking-[0.1em] uppercase " + (profile ? "text-signal" : "text-muted")}>{status}</span>
      </div>
      <dl className="px-5">
        {fields.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-b border-line py-3 last:border-b-0">
            <dt className="t-label">{label}</dt>
            <dd className="truncate text-[14px] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-dashed border-line-strong px-5 py-3 font-mono text-[10px] tracking-[0.2em] break-all text-faint uppercase">
        {"CHOG<<" + (profile?.username ?? "UNCLAIMED").toUpperCase() + "<<" + (wallet ? wallet.slice(2, 14).toUpperCase() : "000000000000") + "<<<<"}
      </p>
    </motion.div>
  );
}
