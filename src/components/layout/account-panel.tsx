import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useAccount } from "wagmi";
import { usePassport } from "@/components/passport/passport-provider";
import { Button } from "@/components/ui/button";
import { monadChainLabel } from "@/lib/passport/chain";
import { shortAddress } from "@/lib/passport/format";

export function AccountPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { address, isConnected, chainId } = useAccount();
  const network = monadChainLabel(isConnected ? chainId : undefined);
  const { profile, sessionAddress, status } = usePassport();
  const label = profile?.displayName ?? (sessionAddress ? shortAddress(sessionAddress) : "Guest");
  const detail =
    status === "loading"
      ? "Checking session"
      : profile
        ? `@${profile.username}`
        : sessionAddress
          ? "Signed in, no passport yet"
          : "No passport session";

  return (
    <div className="rounded-xl border border-line bg-gradient-to-b from-elevated to-secondary/40 p-3">
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-action to-pink text-on-accent"
          aria-hidden="true"
        >
          <UserRound className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{label}</p>
          <p className="text-xs text-muted">{detail}</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {isConnected && address
          ? `Wallet ${shortAddress(address)} · ${network.label}. A different address does not take over this passport.`
          : "Use Wallet in the header to connect. A connection is not a passport."}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button asChild variant="secondary" className="w-full">
          <Link to="/passport" onClick={onNavigate}>
            {profile ? "Edit passport" : "Open passport"}
          </Link>
        </Button>
        {profile ? (
          <Button asChild variant="ghost" className="w-full">
            <Link to="/passport/$username" params={{ username: profile.username }} onClick={onNavigate}>
              View public page
            </Link>
          </Button>
        ) : null}
        <Link to="/network" onClick={onNavigate} className="text-center text-xs font-semibold text-sand">
          Monad network
        </Link>
      </div>
    </div>
  );
}
