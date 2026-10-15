import { motion, useMotionValue, useSpring } from "motion/react";
import { LogoMark } from "@/components/brand/logo";
import { formatDay, shortAddress } from "@/lib/passport/format";
import type { PublicProfile } from "@/lib/passport/types";

/** The passport as a premium card: warm gradient, ring watermark, gentle tilt. Only real state is shown. */
export function PassportRecord({ profile, address }: { profile: PublicProfile | null; address: string | null }) {
  const rx = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 });
  const wallet = profile?.walletAddress ?? address;
  const status = profile ? "Member" : address ? "Signed in · not saved" : "Unclaimed";

  return (
    <div style={{ perspective: 1200 }} className="mx-auto w-full max-w-[30rem]">
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{ rotateX: rx, rotateY: ry }}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          ry.set(((event.clientX - rect.left) / rect.width - 0.5) * 10);
          rx.set(-((event.clientY - rect.top) / rect.height - 0.5) * 8);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        className="signal-glow relative aspect-[1.586/1] overflow-hidden rounded-[1.75rem] border border-signal/25 bg-[linear-gradient(135deg,#3a2a9a_0%,#21185a_40%,#120d2c_100%)] p-6 sm:p-7"
      >
        <LogoMark className="pointer-events-none absolute -right-12 -bottom-14 size-64 text-signal/[0.08]" />
        <div className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full bg-signal/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-ink">
              <LogoMark className="size-5" />
              <span className="t-h3">Choguild passport</span>
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-label text-body">{status}</span>
          </div>
          <div>
            <p className="t-h2 text-ink">
              {profile ? profile.displayName : address ? "Finish your passport" : "Your name here"}
            </p>
            <p className="mt-2 text-small text-body">
              {profile ? `@${profile.username}` : "Connect a wallet and sign to claim it."}
              {profile && profile.skills.length > 0 ? ` · ${profile.skills.slice(0, 3).join(", ")}` : ""}
            </p>
          </div>
          <div className="flex items-end justify-between font-mono text-label text-muted">
            <span>{wallet ? shortAddress(wallet) : "0x···· ····"}</span>
            <span>{profile ? `Since ${formatDay(profile.createdAt)}` : "Monad"}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
