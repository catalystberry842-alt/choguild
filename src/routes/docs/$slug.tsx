import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "@/components/docs/docs-layout";
import { docBySlug } from "@/components/docs/content";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/docs/$slug")({
  loader: ({ params }) => {
    if (!docBySlug(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  staticData: { title: "Docs" },
  head: ({ params }) => {
    const page = docBySlug(params.slug);
    return seo({ title: `${page?.title ?? "Docs"} · Choguild docs`, description: page?.lead ?? "", path: `/docs/${params.slug}` });
  },
  component: DocPageView,
});

function DocPageView() {
  const { slug } = Route.useLoaderData();
  return <DocsLayout page={docBySlug(slug)!} />;
}
