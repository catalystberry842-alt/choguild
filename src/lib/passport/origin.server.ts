import { getRequest, getRequestHost, getRequestProtocol } from "@tanstack/react-start/server";
import { sameOriginDecision } from "@/lib/passport/origin";

export function requestAuthority(): { domain: string; uri: string } {
  const domain = getRequestHost({ xForwardedHost: true });
  const protocol = getRequestProtocol({ xForwardedProto: true });
  return { domain, uri: `${protocol}://${domain}` };
}

export function assertSameOrigin(): void {
  const request = getRequest();
  const decision = sameOriginDecision({
    origin: request.headers.get("origin"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    expectedOrigin: requestAuthority().uri,
  });
  if (!decision.ok) throw new Error(decision.error);
}
