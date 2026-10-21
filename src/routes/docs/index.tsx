import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/docs/docs-layout";
import { DOCS } from "@/components/docs/content";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/docs/")({
  staticData: { title: "Docs" },
  head: () => seo({ title: "Docs · Choguild", description: DOCS[0].lead, path: "/docs" }),
  component: () => <DocsLayout page={DOCS[0]} />,
});
