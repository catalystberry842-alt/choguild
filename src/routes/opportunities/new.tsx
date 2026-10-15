import { createFileRoute, Link } from "@tanstack/react-router";
import { OpportunityForm } from "@/components/board/opportunity-form";
import { usePassport } from "@/components/passport/passport-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";

export const Route = createFileRoute("/opportunities/new")({
  staticData: { title: "Publish work", crumb: "Publish" },
  head: () => ({ meta: [{ title: "Publish work · Choguild" }] }),
  component: NewOpportunityPage,
});

function NewOpportunityPage() {
  const { status, sessionAddress, profile } = usePassport();
  if (status === "loading") return <LoadingState label="Checking your Passport" />;
  if (!sessionAddress || !profile) {
    return (
      <div>
        <PageHeader title="Publish work" />
        <div className="mt-10">
          <EmptyState
            title="Save your Passport to publish"
            action={
              <Button asChild size="compact">
                <Link to="/passport">Open Passport</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Publish work" description="Describe the work clearly. You can save a draft and publish later." />
      <div className="mt-10">
        <OpportunityForm />
      </div>
    </div>
  );
}
