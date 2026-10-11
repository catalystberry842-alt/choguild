import { createFileRoute, Link } from "@tanstack/react-router";
import { OpportunityForm } from "@/components/board/opportunity-form";
import { usePassport } from "@/components/passport/passport-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

export const Route = createFileRoute("/opportunities/new")({
  staticData: { title: "Publish", crumb: "Publish" },
  head: () => ({ meta: [{ title: "Publish · Choguild" }] }),
  component: NewOpportunityPage,
});

function NewOpportunityPage() {
  const { status, sessionAddress, profile } = usePassport();
  if (status === "loading") return <LoadingState label="Checking passport" />;
  if (!sessionAddress || !profile) {
    return (
      <EmptyState
        title="A passport is required to publish"
        body="Sign in and save a Chog Passport first, because a connected wallet is not an account."
        action={<Button asChild><Link to="/passport">Open passport</Link></Button>}
      />
    );
  }
  return (
    <div>
      <h1 className="text-[2.5rem] font-bold tracking-tight text-ink">Publish an opportunity</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-body">
        You can save a draft or review it and publish. Only the terms you write are shown. Nothing here creates a payment.
      </p>
      <div className="mt-10">
        <OpportunityForm />
      </div>
    </div>
  );
}
