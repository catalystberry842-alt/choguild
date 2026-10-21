import { Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Github, Link2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ChogBadge, ChogGallery } from "@/components/chog/chog-bits";
import { RankMedal, TierBadge, XpBar } from "@/components/ranking/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { ChogHolding } from "@/lib/chog/chog";
import { cn } from "@/lib/cn";
import { explorerAddressUrl } from "@/lib/passport/chain";
import { formatStamp, shortAddress } from "@/lib/passport/format";
import type { PublicProfile } from "@/lib/passport/types";
import { formatXp } from "@/lib/ranking/xp";
import type { ContributionSummary } from "@/lib/work/types";

export type PassportStanding = {
  rank: number;
  xp: number;
  tier: string;
  nextTier: string | null;
  progress: number;
  guildXp: number;
  onchainXp: number | null;
  txCount: number | null;
  acceptedSubmissions: number;
  publishedOpportunities: number;
};

export function PublicPassport({
  profile,
  owner,
  contributions,
  chog,
  standing,
}: {
  profile: PublicProfile;
  owner: boolean;
  contributions: ContributionSummary;
  chog?: ChogHolding | null;
  standing?: PassportStanding | null;
}) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const initial = profile.displayName.slice(0, 1).toUpperCase();
  const explorer = explorerAddressUrl(profile.walletAddress);
  const chogCount = chog?.count ?? 0;

  async function copy(value: string, which: "address" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError(null);
      if (which === "address") {
        setCopiedAddress(true);
        window.setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedUrl(true);
        window.setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch {
      setCopyError("That value could not be copied from this browser.");
    }
  }

  const links = [
    profile.githubUrl ? { label: "GitHub", url: profile.githubUrl, kind: "github" as const } : null,
    profile.xUrl ? { label: "X", url: profile.xUrl, kind: "x" as const } : null,
    ...profile.otherLinks.map((link) => ({ ...link, kind: "other" as const })),
  ].filter((link): link is { label: string; url: string; kind: "github" | "x" | "other" } => Boolean(link));

  const accepted = standing?.acceptedSubmissions ?? contributions.accepted;
  const listings = standing?.publishedOpportunities ?? 0;
  const xp = standing?.xp ?? null;
  const txLabel =
    standing == null
      ? "—"
      : standing.txCount === null
        ? "unavailable"
        : formatXp(standing.txCount);

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6 sm:gap-8 lg:max-w-6xl 2xl:max-w-7xl lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-8">
      {/* Hero: single passport-glass surface (blur once; no nested blur stacks). */}
      <section className="relative pt-2 lg:col-span-2">

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-full ring-1 ring-line-strong"
            />
            {profile.avatarUrl && !avatarFailed ? (
              <img
                src={profile.avatarUrl}
                alt=""
                width={112}
                height={112}
                className="relative size-24 rounded-full object-cover ring-2 ring-white/10 sm:size-28"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span
                className="relative flex size-24 items-center justify-center rounded-full bg-elevated text-3xl font-semibold text-ink ring-2 ring-white/10 sm:size-28"
                aria-hidden="true"
              >
                {initial}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {standing ? <RankMedal rank={standing.rank} size="lg" /> : null}
              <h1 className="t-title tracking-tight">{profile.displayName}</h1>
            </div>
            <p className="t-meta mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span>@{profile.username}</span>
              <ChogBadge count={chogCount} />
              {standing ? <TierBadge tier={standing.tier} /> : null}
              {profile.visibility === "unlisted" ? <Badge tone="warning">Unlisted</Badge> : null}
            </p>

            {standing ? (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 sm:justify-start">
                  <span className="text-small font-semibold tabular-nums text-ink">
                    {formatXp(standing.xp)} XP
                  </span>
                  <span className="t-meta">
                    {standing.nextTier ? (
                      <>
                        Level progress toward <em className="not-italic text-signal">{standing.nextTier}</em>
                      </>
                    ) : (
                      "Max tier"
                    )}
                  </span>
                </div>
                <XpBar xp={standing.xp} />
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-black/25 px-3 py-1.5 font-mono text-small text-ink">
                {shortAddress(profile.walletAddress)}
              </span>
              <Button
                variant="secondary"
                size="icon"
                className="size-9"
                aria-label={copiedAddress ? "Address copied" : "Copy address"}
                onClick={() => void copy(profile.walletAddress, "address")}
              >
                {copiedAddress ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              </Button>
              {explorer ? (
                <Button asChild variant="secondary" size="icon" className="size-9">
                  <a href={explorer} target="_blank" rel="noreferrer" aria-label="Open in explorer">
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <dl className="relative mt-10 grid grid-cols-2 gap-y-6 border-t border-line pt-6 sm:grid-cols-4">
          <Stat label="Accepted work" value={String(accepted)} />
          <Stat label="Listings" value={String(listings)} />
          <Stat label="XP" value={xp === null ? "—" : formatXp(xp)} />
          <Stat label="Onchain txs" value={txLabel} muted={txLabel === "unavailable"} />
        </dl>
      </section>

      <aside className="flex min-w-0 flex-col gap-6 sm:gap-8 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-2">
      {profile.biography ? (
        <section className="surface p-6">
          <h2 className="t-kicker">Bio</h2>
          <p className="t-body mt-3 text-pretty text-ink">{profile.biography}</p>
        </section>
      ) : null}

      {profile.skills.length > 0 || profile.interests?.trim() || links.length > 0 ? (
        <section className="surface divide-y divide-line px-6">
          {profile.skills.length > 0 ? (
            <div className="py-6">
              <h2 className="t-kicker">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="glass-chip rounded-full px-3 py-1 text-small text-ink">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {profile.interests?.trim() ? (
            <div className="py-6">
              <h2 className="t-kicker">Interests</h2>
              <p className="t-body mt-3 text-pretty text-ink">{profile.interests}</p>
            </div>
          ) : null}
          {links.length > 0 ? (
            <div className="py-6">
              <h2 className="t-kicker">Links</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-4 text-small text-ink transition-colors hover:border-signal/50 hover:bg-signal/10"
                      aria-label={link.label}
                      title={link.label}
                    >
                      <LinkIcon kind={link.kind} />
                      <span>{link.kind === "x" ? "X" : link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {chog && chog.count > 0 ? <ChogGallery holding={chog} /> : null}
      </aside>

      <div className="flex min-w-0 flex-col gap-6 sm:gap-8 lg:col-start-1 lg:row-start-2">

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="t-h2">
            Contribution <em>history</em>
          </h2>
          {contributions.accepted > 0 ? (
            <p className="t-meta">
              {contributions.accepted} accepted across {contributions.opportunities}{" "}
              {contributions.opportunities === 1 ? "opportunity" : "opportunities"}
            </p>
          ) : null}
        </div>

        {contributions.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {contributions.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        ) : null}

        {contributions.items.length > 0 ? (
          <ul className="grid gap-3">
            {contributions.items.map((item) => (
              <li key={item.id} className="surface p-5 sm:p-6">
                <h3 className="t-h3">{item.title}</h3>
                <p className="t-meta mt-1.5">
                  {item.projectName} · {item.opportunityTitle} · Accepted {formatStamp(item.acceptedAt)}
                </p>
                {item.evidence === null ? (
                  <p className="t-meta mt-3">Evidence is private.</p>
                ) : item.evidence.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {item.evidence.map((link) => (
                      <li key={link.url}>
                        <a className="t-link inline-flex min-h-6 items-center gap-1.5 text-base" href={link.url} target="_blank" rel="noreferrer">
                          <Link2 className="size-3.5 shrink-0" aria-hidden="true" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            level={3}
            title="No accepted work yet"
            body="Accepted submissions will show up here as a public contribution record."
          />
        )}
      </section>

      <p className="t-meta">
        Created {formatStamp(profile.createdAt)} · Updated {formatStamp(profile.updatedAt)}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void copy(window.location.href, "url")}>
          {copiedUrl ? "Copied" : "Copy profile URL"}
        </Button>
        {owner ? (
          <Button asChild>
            <Link to="/passport">Edit profile</Link>
          </Button>
        ) : null}
      </div>
      {copyError ? <p className="text-base text-danger">{copyError}</p> : null}
      </div>
    </article>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="border-l border-line pl-4 first:border-l-0 first:pl-0 max-sm:[&:nth-child(3)]:border-l-0 max-sm:[&:nth-child(3)]:pl-0">
      <dt className="t-kicker">{label}</dt>
      <dd className={cn("mt-2 text-2xl font-medium tracking-[-0.04em] tabular-nums text-ink", muted && "text-base text-muted")}>
        {value}
      </dd>
    </div>
  );
}

function LinkIcon({ kind }: { kind: "github" | "x" | "other" }): ReactNode {
  if (kind === "github") return <Github className="size-4" aria-hidden="true" />;
  if (kind === "x") {
    return (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    );
  }
  return <Link2 className="size-4" aria-hidden="true" />;
}
