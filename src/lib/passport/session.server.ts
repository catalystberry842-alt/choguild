import { randomBytes } from "node:crypto";
import { getRequestProtocol, useSession as requestSession } from "@tanstack/react-start/server";
import { env, isLocalDev } from "@/lib/env.server";
import { resolveSessionSecret } from "@/lib/passport/session-secret";

type PassportSessionData = {
  sessionId: string;
  address: string;
  /** The Chog this wallet is acting as (re-verified with live ownerOf on every action). */
  chogId?: number | null;
};

function sessionPassword(): string {
  const resolved = resolveSessionSecret({
    explicit: env("CHOG_SESSION_SECRET"),
    databaseUrl: env("DATABASE_URL") ?? env("POSTGRES_URL") ?? env("DATABASE_URL_UNPOOLED"),
    preview: isLocalDev(),
  });
  if (resolved) return resolved;
  const holder = globalThis as typeof globalThis & { __chogSessionSecret?: string };
  holder.__chogSessionSecret ??= randomBytes(32).toString("hex");
  return holder.__chogSessionSecret;
}

function sessionConfig() {
  return {
    name: "chog_passport",
    password: sessionPassword(),
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: getRequestProtocol({ xForwardedProto: true }) === "https",
      path: "/",
    },
  };
}

/** True when sessions can be opened (CHOG_SESSION_SECRET resolved). Public pages never depend on it. */
function sessionsConfigured(): boolean {
  try {
    sessionPassword();
    return true;
  } catch (error) {
    const holder = globalThis as typeof globalThis & { __chogSecretWarned?: boolean };
    if (!holder.__chogSecretWarned) {
      holder.__chogSecretWarned = true;
      console.error("[passport]", error instanceof Error ? error.message : error);
    }
    return false;
  }
}

/** Reads the signed-in session; null (signed out) when sessions are not configured, so public pages still render. */
export async function readSessionRecord(): Promise<PassportSessionData | null> {
  if (!sessionsConfigured()) return null;
  const session = await requestSession<PassportSessionData>(sessionConfig());
  if (!session.data.sessionId || !session.data.address) return null;
  return { sessionId: session.data.sessionId, address: session.data.address, chogId: session.data.chogId ?? null };
}

export async function writeSessionRecord(data: PassportSessionData): Promise<void> {
  if (!sessionsConfigured()) throw new Error("Passport sign-in is temporarily unavailable. The site is missing its session secret.");
  const session = await requestSession<PassportSessionData>(sessionConfig());
  await session.update(data);
}

export async function clearSessionRecord(): Promise<void> {
  if (!sessionsConfigured()) return;
  const session = await requestSession<PassportSessionData>(sessionConfig());
  await session.clear();
}
