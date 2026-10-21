export const SITE_ORIGIN = "https://choguild.vercel.app";

/** Per-page title, description, canonical URL and social tags. */
export function seo({
  title,
  description,
  path,
  noindex = false,
  type,
}: {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  /** og:type override, e.g. "profile" for passports. */
  type?: string;
}) {
  const url = path ? `${SITE_ORIGIN}${path}` : undefined;
  const desc = description?.replace(/\s+/g, " ").trim().slice(0, 200);
  return {
    meta: [
      { title },
      { property: "og:title", content: title },
      { name: "twitter:title", content: title },
      ...(desc
        ? [
            { name: "description", content: desc },
            { property: "og:description", content: desc },
            { name: "twitter:description", content: desc },
          ]
        : []),
      ...(url ? [{ property: "og:url", content: url }] : []),
      ...(type ? [{ property: "og:type", content: type }] : []),
      ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: url ? [{ rel: "canonical", href: url }] : [],
  };
}
