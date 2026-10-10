export type CompletionInput = {
  biography: string;
  skills: string[];
  portfolioUrl: string | null;
  githubUrl: string | null;
  xUrl: string | null;
  otherLinks: { url: string }[];
  avatarUrl: string | null;
};

export type CompletionItem = {
  id: string;
  label: string;
  done: boolean;
};

/**
 * Profile details checklist. This is not a reputation score.
 * Username, display name, and a biography are required before a passport can be saved.
 * These five checks only describe optional detail that is still missing.
 */
export function profileCompletion(profile: CompletionInput): CompletionItem[] {
  return [
    {
      id: "bio",
      label: "Biography of at least 40 characters",
      done: profile.biography.trim().length >= 40,
    },
    {
      id: "skills",
      label: "At least one skill",
      done: profile.skills.length > 0,
    },
    {
      id: "portfolio",
      label: "Portfolio URL",
      done: Boolean(profile.portfolioUrl),
    },
    {
      id: "social",
      label: "A GitHub, X, or other link",
      done: Boolean(profile.githubUrl || profile.xUrl || profile.otherLinks.length > 0),
    },
    {
      id: "avatar",
      label: "Avatar URL",
      done: Boolean(profile.avatarUrl),
    },
  ];
}

export function completionSummary(items: CompletionItem[]): string {
  const done = items.filter((item) => item.done).length;
  return `${done} of ${items.length} profile details`;
}
