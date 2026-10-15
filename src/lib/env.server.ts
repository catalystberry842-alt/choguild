export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Local development (`npm run dev`) versus a deployed build. Locally a missing
 * session secret falls back to a per-process random one; deployed builds must
 * set CHOG_SESSION_SECRET.
 */
export function isLocalDev(): boolean {
  return process.env.NODE_ENV !== "production" && !env("VERCEL");
}
