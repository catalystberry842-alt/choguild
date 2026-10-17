/**
 * Passport avatars: shared rules for the browser (crop + compress) and the
 * server (sniff + store). Uploaded images live at /api/avatar/<uuid>; holders
 * can also point at their Chog via /api/chog/<tokenId>. Older passports may
 * still carry an external https avatar URL, which keeps rendering.
 */
import { isChogTokenId } from "@/lib/chog/chog";

/** Edge length of the stored square avatar. */
export const AVATAR_SIZE = 512;
/** Target size for the browser-compressed image. */
export const AVATAR_TARGET_BYTES = 200_000;
/** Hard server-side cap for one stored avatar. */
export const AVATAR_MAX_BYTES = 300_000;
/** Largest original file the browser will try to decode. */
export const AVATAR_SOURCE_MAX_BYTES = 10 * 1024 * 1024;
/** Originals the picker accepts (GIFs use their first frame). */
export const AVATAR_SOURCE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
/** Formats the server stores (what the browser re-encodes to; PNG as a last resort). */
export const AVATAR_STORED_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
export type StoredAvatarType = (typeof AVATAR_STORED_TYPES)[number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isAvatarId(value: string): boolean {
  return UUID.test(value);
}

export function avatarPath(id: string): string {
  return `/api/avatar/${id}`;
}

/** The kind of avatar a stored value points at. */
export type AvatarRef =
  | { kind: "none" }
  | { kind: "upload"; id: string }
  | { kind: "chog"; tokenId: number }
  | { kind: "external"; url: string }
  | { kind: "invalid" };

export function parseAvatarRef(value: string | null | undefined): AvatarRef {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { kind: "none" };
  const upload = /^\/api\/avatar\/([^/?#]+)$/.exec(trimmed);
  if (upload) return isAvatarId(upload[1]) ? { kind: "upload", id: upload[1] } : { kind: "invalid" };
  const chog = /^\/api\/chog\/(\d{1,5})$/.exec(trimmed);
  if (chog) {
    const tokenId = Number(chog[1]);
    return isChogTokenId(tokenId) ? { kind: "chog", tokenId } : { kind: "invalid" };
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" && !url.username && !url.password) return { kind: "external", url: url.toString() };
  } catch {
    // fall through
  }
  return { kind: "invalid" };
}

/** Identify an image from its first bytes; never trust a client-sent content type. */
export function sniffImageType(bytes: Uint8Array): StoredAvatarType | "image/gif" | null {
  const at = (index: number) => bytes[index] ?? -1;
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 && at(4) === 0x0d && at(5) === 0x0a) return "image/png";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) return "image/gif";
  return null;
}

/** Server check for an uploaded avatar body. */
export function checkAvatarUpload(
  bytes: Uint8Array,
): { ok: true; type: StoredAvatarType } | { ok: false; status: number; error: string } {
  if (bytes.length === 0) return { ok: false, status: 400, error: "The upload was empty." };
  if (bytes.length > AVATAR_MAX_BYTES) {
    return { ok: false, status: 413, error: `Avatars must be ${Math.round(AVATAR_MAX_BYTES / 1000)} KB or smaller after compression.` };
  }
  const type = sniffImageType(bytes);
  if (!type || !(AVATAR_STORED_TYPES as readonly string[]).includes(type)) {
    return { ok: false, status: 415, error: "Upload a WebP, JPEG or PNG image." };
  }
  return { ok: true, type: type as StoredAvatarType };
}

/** Browser check for a picked file before decoding it. */
export function checkAvatarSource(file: { type: string; size: number; name?: string }): string | null {
  const type = file.type || guessType(file.name ?? "");
  if (!(AVATAR_SOURCE_TYPES as readonly string[]).includes(type)) return "Choose a PNG, JPG, WebP or GIF image.";
  if (file.size > AVATAR_SOURCE_MAX_BYTES) return "Choose an image under 10 MB.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

function guessType(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "";
}

/** Centered square crop of a width × height image, scaled to at most AVATAR_SIZE. */
export function squareCrop(width: number, height: number, max = AVATAR_SIZE) {
  const side = Math.min(width, height);
  return {
    sx: Math.floor((width - side) / 2),
    sy: Math.floor((height - side) / 2),
    side,
    out: Math.max(1, Math.min(max, side)),
  };
}
