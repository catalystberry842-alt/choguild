import { getAddress, isAddress } from "viem";
import { parseAvatarRef } from "@/lib/passport/avatar";

export const LIMITS = {
  usernameMin: 3,
  usernameMax: 20,
  displayNameMax: 48,
  biographyMax: 280,
  interestsMax: 160,
  skillMax: 32,
  skillCount: 12,
  urlMax: 200,
  otherLinkCount: 4,
  linkLabelMax: 32,
} as const;

const RESERVED = new Set([
  "admin",
  "account",
  "api",
  "choguild",
  "discover",
  "passport",
  "submissions",
  "support",
  "wallet",
  "www",
]);

const USERNAME = /^[a-z][a-z0-9_]{2,19}$/;

export type OtherLink = { label: string; url: string };

export type ProfileInput = {
  username: string;
  displayName: string;
  biography: string;
  avatarUrl: string;
  skills: string[];
  githubUrl: string;
  xUrl: string;
  otherLinks: OtherLink[];
  interests: string;
  visibility: "public" | "unlisted";
};

export type ProfileRecord = {
  username: string;
  displayName: string;
  biography: string;
  avatarUrl: string | null;
  skills: string[];
  githubUrl: string | null;
  xUrl: string | null;
  otherLinks: OtherLink[];
  interests: string | null;
  visibility: "public" | "unlisted";
};

export type FieldErrors = Partial<Record<keyof ProfileInput | "form", string>>;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeAddress(value: string): `0x${string}` | null {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed);
}

export function storedAddress(value: string): string | null {
  const checksum = normalizeAddress(value);
  return checksum ? checksum.toLowerCase() : null;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function optionalHttps(value: string, label: string, errors: FieldErrors, key: keyof ProfileInput): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > LIMITS.urlMax) {
    errors[key] = `${label} must be ${LIMITS.urlMax} characters or fewer.`;
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    errors[key] = `${label} must be a valid https URL.`;
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    errors[key] = `${label} must be an https URL without a username or password.`;
    return null;
  }
  return url.toString();
}

export function validateProfile(input: ProfileInput): { ok: true; value: ProfileRecord } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const username = normalizeUsername(input.username);
  if (!USERNAME.test(username)) {
    errors.username = "Use 3–20 characters: start with a letter, then lowercase letters, numbers, or underscores.";
  } else if (RESERVED.has(username)) {
    errors.username = "That username is reserved.";
  }

  const displayName = cleanText(input.displayName);
  if (!displayName) errors.displayName = "Display name is required.";
  else if (displayName.length > LIMITS.displayNameMax) {
    errors.displayName = `Display name must be ${LIMITS.displayNameMax} characters or fewer.`;
  }

  const biography = input.biography.trim();
  if (!biography) errors.biography = "A short biography is required.";
  else if (biography.length > LIMITS.biographyMax) {
    errors.biography = `Biography must be ${LIMITS.biographyMax} characters or fewer.`;
  }

  // Avatars are uploaded images (/api/avatar/:id), a Chog (/api/chog/:id), or a
  // legacy https URL already on the passport (the server checks ownership/history).
  const avatarRef = parseAvatarRef(input.avatarUrl);
  let avatarUrl: string | null = null;
  if (avatarRef.kind === "invalid") errors.avatarUrl = "Upload an image for your avatar.";
  else if (avatarRef.kind === "external") {
    if (avatarRef.url.length > LIMITS.urlMax) errors.avatarUrl = "Upload an image for your avatar.";
    else avatarUrl = avatarRef.url;
  } else if (avatarRef.kind !== "none") avatarUrl = input.avatarUrl.trim();

  let githubUrl = optionalHttps(input.githubUrl, "GitHub URL", errors, "githubUrl");
  if (githubUrl && !errors.githubUrl) {
    const url = new URL(githubUrl);
    if (url.hostname !== "github.com" || url.pathname.split("/").filter(Boolean).length < 1) {
      errors.githubUrl = "Use an https://github.com/username URL.";
      githubUrl = null;
    }
  }

  let xUrl = optionalHttps(input.xUrl, "X URL", errors, "xUrl");
  if (xUrl && !errors.xUrl) {
    const url = new URL(xUrl);
    const hostOk = url.hostname === "x.com" || url.hostname === "twitter.com";
    if (!hostOk || url.pathname.split("/").filter(Boolean).length < 1) {
      errors.xUrl = "Use an https://x.com/username or https://twitter.com/username URL.";
      xUrl = null;
    }
  }

  const skills: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.skills) {
    const skill = cleanText(raw);
    if (!skill) continue;
    if (skill.length < 2 || skill.length > LIMITS.skillMax) {
      errors.skills = `Each skill must be 2–${LIMITS.skillMax} characters.`;
      break;
    }
    if (!/^[\p{L}\p{N}][\p{L}\p{N} .&+/-]*$/u.test(skill)) {
      errors.skills = "Skills can use letters, numbers, spaces, and . & + / -.";
      break;
    }
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
  }
  if (!errors.skills && skills.length > LIMITS.skillCount) {
    errors.skills = `Add up to ${LIMITS.skillCount} skills.`;
  }

  const otherLinks: OtherLink[] = [];
  if (input.otherLinks.length > LIMITS.otherLinkCount) {
    errors.otherLinks = `Add up to ${LIMITS.otherLinkCount} other links.`;
  } else {
    input.otherLinks.forEach((link, index) => {
      const label = cleanText(link.label);
      const url = link.url.trim();
      if (!label && !url) return;
      if (!label || label.length > LIMITS.linkLabelMax) {
        errors.otherLinks = `Link ${index + 1} needs a label of 1–${LIMITS.linkLabelMax} characters.`;
        return;
      }
      const href = optionalHttps(url, `Link ${index + 1}`, errors, "otherLinks");
      if (href) otherLinks.push({ label, url: href });
    });
  }

  const interests = cleanText(input.interests);
  if (interests.length > LIMITS.interestsMax) {
    errors.interests = `Interests must be ${LIMITS.interestsMax} characters or fewer.`;
  }

  const visibility = input.visibility === "unlisted" ? "unlisted" : input.visibility === "public" ? "public" : null;
  if (!visibility) errors.visibility = "Choose public or unlisted.";

  if (Object.keys(errors).length > 0 || !visibility) return { ok: false, errors };

  return {
    ok: true,
    value: {
      username,
      displayName,
      biography,
      avatarUrl,
      skills,
      githubUrl,
      xUrl,
      otherLinks,
      interests: interests || null,
      visibility,
    },
  };
}
