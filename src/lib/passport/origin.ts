export function sameOriginDecision(input: {
  origin: string | null;
  secFetchSite: string | null;
  expectedOrigin: string;
}): { ok: true } | { ok: false; error: string } {
  if (input.secFetchSite === "cross-site") {
    return { ok: false, error: "This request was blocked because it came from another site." };
  }
  if (!input.origin) {
    if (input.secFetchSite === "same-origin" || input.secFetchSite === "none" || !input.secFetchSite) {
      return { ok: true };
    }
    return { ok: false, error: "This request was blocked because its origin could not be verified." };
  }
  if (input.origin !== input.expectedOrigin) {
    return { ok: false, error: "This request was blocked because its origin did not match this site." };
  }
  return { ok: true };
}
