import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "@/components/brand/logo";
import { shortAddress, formatDay } from "@/lib/passport/format";
import type { PublicProfile } from "@/lib/passport/types";

/**
 * The passport as an object: a glass card that tilts toward the cursor and
 * shows only real state (saved profile, signed-in address, or unclaimed).
 */
export function PassportCard({ profile, address }: { profile: PublicProfile | null; address: string | null }) {
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const glareX = useTransform(ry, [-8, 8], ["20%", "80%"]);
  const wallet = profile?.walletAddress ?? address;
  const status = profile ? "Member" : address ? "Signed in · not saved" : "Unclaimed";

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        className="surface relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.4rem] p-6 sm:p-7"
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          ry.set(((event.clientX - rect.left) / rect.width - 0.5) * 12);
          rx.set(-((event.clientY - rect.top) / rect.height - 0.5) * 10);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgb(120_105_230/0.28),transparent_60%),radial-gradient(70%_60%_at_0%_100%,rgb(80_100_220/0.14),transparent_60%)]"
          aria-hidden="true"
        />
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
          style={{
            background: useTransform(glareX, (x) => `radial-gradient(40% 60% at ${x} 0%, rgb(255 255 255 / 0.18), transparent 70%)`),
          }}
          aria-hidden="true"
        />
        <LogoMark className="pointer-events-none absolute -right-10 -bottom-12 size-56 text-white/[0.04]" />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-medium tracking-[-0.01em] text-ink">
              <LogoMark className="size-4" /> Choguild Passport
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-body">{status}</span>
          </div>

          <div>
            <p className="text-[clamp(1.4rem,1rem+1.6vw,1.9rem)] leading-tight font-semibold tracking-[-0.04em] text-ink">
              {profile ? profile.displayName : address ? "Finish your passport" : "Your name goes here"}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              {profile ? `@${profile.username}` : "Connect a wallet and sign to claim it."}
            </p>
            {profile && profile.skills.length > 0 ? (
              <p className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-body">
                    {skill}
                  </span>
                ))}
              </p>
            ) : null}
          </div>

          <div className="flex items-end justify-between font-mono text-[11px] tracking-wide text-muted uppercase">
            <span>{wallet ? shortAddress(wallet) : "0x····  ····"}</span>
            <span>{profile ? `Since ${formatDay(profile.createdAt)}` : "Monad"}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
