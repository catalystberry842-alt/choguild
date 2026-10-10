import { randomBytes } from "node:crypto";
import { getRequestProtocol, useSession as requestSession } from "@tanstack/react-start/server";
import { env, isWorkspacePreview } from "@/lib/env.server";
import { resolveSessionSecret } from "@/lib/passport/session-secret";

type PassportSessionData = {
  sessionId: string;
  address: string;
};

function sessionPassword(): string {
  const resolved = resolveSessionSecret({
    explicit: env("CHOG_SESSION_SECRET") ?? env("BETTER_AUTH_SECRET"),
    databaseUrl: env("DATABASE_URL"),
    preview: isWorkspacePreview(),
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

export async function readSessionRecord(): Promise<PassportSessionData | null> {
  const session = await requestSession<PassportSessionData>(sessionConfig());
  if (!session.data.sessionId || !session.data.address) return null;
  return { sessionId: session.data.sessionId, address: session.data.address };
}

export async function writeSessionRecord(data: PassportSessionData): Promise<void> {
  const session = await requestSession<PassportSessionData>(sessionConfig());
  await session.update(data);
}

export async function clearSessionRecord(): Promise<void> {
  const session = await requestSession<PassportSessionData>(sessionConfig());
  await session.clear();
}
