export function resolveSessionSecret(input: {
  explicit?: string;
  databaseUrl?: string;
  preview: boolean;
}): string | null {
  if (input.explicit && input.explicit.length >= 32) return input.explicit;
  if (input.databaseUrl) {
    throw new Error("Set CHOG_SESSION_SECRET to at least 32 characters when DATABASE_URL is configured.");
  }
  if (input.preview) return null;
  throw new Error("Set CHOG_SESSION_SECRET to at least 32 characters before passport sign-in can open a session.");
}
