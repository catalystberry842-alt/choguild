import { createFileRoute, Link } from "@tanstack/react-router";
import { OpportunityForm } from "@/components/board/opportunity-form";
import { usePassport } from "@/components/passport/passport-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/opportunities/new")({
  staticData: { title: "Publish work", crumb: "Publish" },
  head: () => seo({ title: "Publish · Choguild", noindex: true }),
  component: NewOpportunityPage,
});

function NewOpportunityPage() {
  const { status, sessionAddress, profile } = usePassport();
  if (status === "loading") return <LoadingState label="Checking passport" layout="detail" />;
  if (!sessionAddress || !profile) {
    return (
      <div>
        <PageHeader eyebrow="Publish" title="Publish work" />
        <div className="mt-10">
          <EmptyState
            title="Save your passport to publish"
            action={
              <Button asChild size="compact">
                <Link to="/passport">Sign in on passport</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader eyebrow="Publish" title="Publish work" description="Describe the work clearly. You can save a draft and publish later." />
      <div className="mt-10">
        <OpportunityForm />
      </div>
    </div>
  );
}
