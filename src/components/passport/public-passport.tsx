import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { explorerAddressUrl } from "@/lib/passport/chain";
import { formatStamp, shortAddress } from "@/lib/passport/format";
import type { PublicProfile } from "@/lib/passport/types";
import type { ContributionSummary } from "@/lib/work/types";

export function PublicPassport({
  profile,
  owner,
  contributions,
}: {
  profile: PublicProfile;
  owner: boolean;
  contributions: ContributionSummary;
}) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const initial = profile.displayName.slice(0, 1).toUpperCase();

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
    profile.portfolioUrl ? { label: "Portfolio", url: profile.portfolioUrl } : null,
    profile.githubUrl ? { label: "GitHub", url: profile.githubUrl } : null,
    profile.xUrl ? { label: "X", url: profile.xUrl } : null,
    ...profile.otherLinks,
  ].filter((link): link is { label: string; url: string } => Boolean(link));

  return (
    <article>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {profile.avatarUrl && !avatarFailed ? (
          <img
            src={profile.avatarUrl}
            alt=""
            width={72}
            height={72}
            className="size-16 rounded-lg border border-line object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <span
            className="flex size-16 items-center justify-center rounded-2xl border border-line bg-elevated text-xl text-ink"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{profile.displayName}</h1>
          <p className="mt-1 text-sm text-body">@{profile.username}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm text-ink">{shortAddress(profile.walletAddress)}</p>
            <Button variant="secondary" onClick={() => void copy(profile.walletAddress, "address")}>
              {copiedAddress ? "Copied" : "Copy address"}
            </Button>
            {explorerAddressUrl(profile.walletAddress) ? (
              <a className="text-sm font-semibold text-sand" href={explorerAddressUrl(profile.walletAddress) ?? undefined} target="_blank" rel="noreferrer">
                Explorer
              </a>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-muted">This address was signed in to Choguild. Accepted work below is a review record, not a Monad transaction.</p>
        </div>
      </header>

      <p className="mt-10 max-w-2xl text-base leading-7 text-body">{profile.biography}</p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Skills</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {profile.skills.length > 0 ? (
              profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)
            ) : (
              <span className="text-sm text-body">Not added</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Interests</dt>
          <dd className="mt-1 text-sm text-ink">{profile.interests ?? "Not added"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Links</dt>
          <dd className="mt-2 flex flex-col gap-2">
            {links.length > 0 ? (
              links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sand underline-offset-2 hover:underline"
                >
                  {link.label}
                </a>
              ))
            ) : (
              <span className="text-sm text-body">Not added</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Record</dt>
          <dd className="mt-1 text-sm text-body">
            Created {formatStamp(profile.createdAt)}
            <br />
            Updated {formatStamp(profile.updatedAt)}
            {profile.visibility === "unlisted" ? <span className="mt-1 block">Unlisted</span> : null}
          </dd>
        </div>
      </dl>

      <section className="mt-12 border-t border-line pt-6">
        <h2 className="text-lg font-semibold text-ink">Accepted work</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-body">
          {contributions.accepted === 0
            ? "No accepted work is attached to this passport. Drafts, rejected submissions, and unreviewed applications are not counted."
            : `${contributions.accepted} accepted ${contributions.accepted === 1 ? "submission" : "submissions"} across ${contributions.opportunities} ${contributions.opportunities === 1 ? "opportunity" : "opportunities"}. This is a record, not a score.`}
        </p>
        {contributions.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {contributions.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
          </div>
        ) : null}
        {contributions.items.length > 0 ? (
          <ul className="mt-4 grid gap-4">
            {contributions.items.map((item) => (
              <li key={item.id} className="rounded-3xl border border-line bg-elevated p-6">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Accepted {formatStamp(item.acceptedAt)}</p>
                <h3 className="mt-1 text-base font-semibold text-ink">{item.title}</h3>
                <p className="text-sm text-body">{item.projectName} · {item.opportunityTitle}</p>
                {item.evidence === null ? (
                  <p className="mt-2 text-sm text-muted">Evidence links were kept private.</p>
                ) : (
                  <ul className="mt-2 grid gap-1">
                    {item.evidence.map((link) => (
                      <li key={link.url}><a className="text-sm text-sand" href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="mt-10 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void copy(window.location.href, "url")}>
          {copiedUrl ? "Copied" : "Copy profile URL"}
        </Button>
        {owner ? (
          <Button asChild>
            <Link to="/passport">Edit profile</Link>
          </Button>
        ) : null}
      </div>
      {copyError ? <p className="mt-2 text-sm text-danger">{copyError}</p> : null}
    </article>
  );
}
