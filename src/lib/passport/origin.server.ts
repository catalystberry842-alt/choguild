import { takeToken } from "@/lib/rate-limit";
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
  const ip =
    request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  // 30 writes per minute per client covers real use and blocks scripted floods.
  if (!takeToken(`write:${ip}`, 30, 60_000)) {
    throw new Error("Too many requests. Wait a minute and try again.");
  }
}
