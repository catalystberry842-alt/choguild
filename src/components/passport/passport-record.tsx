import { LogoMark } from "@/components/brand/logo";
import { formatDay, shortAddress } from "@/lib/passport/format";
import type { PublicProfile } from "@/lib/passport/types";

/** The passport as a premium card: black glass, purple edge glow, logo watermark, gentle tilt. Only real state is shown. */
export function PassportRecord({ profile, address }: { profile: PublicProfile | null; address: string | null }) {
  const wallet = profile?.walletAddress ?? address;
  const status = profile ? "Member" : address ? "Signed in · not saved" : "Unclaimed";

  return (
    <div style={{ perspective: 1200 }} className="mx-auto w-full max-w-[30rem]">
      <div
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const el = event.currentTarget;
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - 0.5) * 10}deg`);
          el.style.setProperty("--rx", `${-((event.clientY - rect.top) / rect.height - 0.5) * 8}deg`);
        }}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--rx", "0deg");
          event.currentTarget.style.setProperty("--ry", "0deg");
        }}
        className="tilt fade-in passport-glass relative aspect-[1.586/1] overflow-hidden rounded-[1.75rem] p-6 sm:p-7"
      >
        <LogoMark className="pointer-events-none absolute -right-12 -bottom-14 size-64 text-signal/[0.12]" />
        
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
      </div>
    </div>
  );
}
