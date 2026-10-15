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
            className="flex size-16 items-center justify-center rounded-full border border-line bg-elevated text-xl text-ink"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="t-title">{profile.displayName}</h1>
          <p className="t-meta mt-1.5">@{profile.username}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm text-ink">{shortAddress(profile.walletAddress)}</p>
            <Button variant="secondary" size="compact" onClick={() => void copy(profile.walletAddress, "address")}>
              {copiedAddress ? "Copied" : "Copy address"}
            </Button>
            {explorerAddressUrl(profile.walletAddress) ? (
              <a className="t-link text-sm" href={explorerAddressUrl(profile.walletAddress) ?? undefined} target="_blank" rel="noreferrer">
                Explorer
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <p className="t-lead mt-10 max-w-2xl">{profile.biography}</p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="t-meta">Skills</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {profile.skills.length > 0 ? (
              profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)
            ) : (
              <span className="text-sm text-body">Not added</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="t-meta">Interests</dt>
          <dd className="mt-1 text-sm text-ink">{profile.interests ?? "Not added"}</dd>
        </div>
        <div>
          <dt className="t-meta">Links</dt>
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
          <dt className="t-meta">Record</dt>
          <dd className="mt-1 text-sm text-body">
            Created {formatStamp(profile.createdAt)}
            <br />
            Updated {formatStamp(profile.updatedAt)}
            {profile.visibility === "unlisted" ? <span className="mt-1 block">Unlisted</span> : null}
          </dd>
        </div>
      </dl>

      <section className="mt-12 border-t border-line pt-12">
        <h2 className="t-h2">Accepted work</h2>
        <p className="t-body mt-1.5 max-w-2xl">
          {contributions.accepted === 0
            ? "No accepted work yet."
            : `${contributions.accepted} accepted ${contributions.accepted === 1 ? "submission" : "submissions"} across ${contributions.opportunities} ${contributions.opportunities === 1 ? "opportunity" : "opportunities"}.`}
        </p>
        {contributions.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {contributions.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
          </div>
        ) : null}
        {contributions.items.length > 0 ? (
          <ul className="mt-4 grid gap-4">
            {contributions.items.map((item) => (
              <li key={item.id} className="surface p-6">
                <h3 className="t-h3">{item.title}</h3>
                <p className="t-meta mt-1">{item.projectName} · {item.opportunityTitle} · Accepted {formatStamp(item.acceptedAt)}</p>
                {item.evidence === null ? (
                  <p className="t-meta mt-3">Evidence is private.</p>
                ) : (
                  <ul className="mt-3 grid gap-1.5">
                    {item.evidence.map((link) => (
                      <li key={link.url}><a className="t-link text-sm" href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
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
