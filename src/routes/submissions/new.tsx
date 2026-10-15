import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkForm } from "@/components/work/work-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectInput } from "@/components/ui/input";
import { getWorkHome } from "@/lib/work/functions";
import { useState } from "react";

export const Route = createFileRoute("/submissions/new")({
  loader: () => getWorkHome(),
  staticData: { title: "Submit work", crumb: "Submit work" },
  head: () => ({ meta: [{ title: "Submit work · Choguild" }] }),
  component: NewSubmissionPage,
});

function NewSubmissionPage() {
  const data = Route.useLoaderData();
  const [applicationId, setApplicationId] = useState(data.eligible[0]?.applicationId ?? "");
  if (!data.ok || data.eligible.length === 0) {
    return (
      <div>
        <PageHeader title="Submit work" />
        <div className="mt-10">
          <EmptyState
            title={data.ok ? "No accepted applications yet" : "Sign in to submit work"}
            body={data.ok ? "You can submit work once a publisher accepts your application." : undefined}
            action={
              <Button asChild size="compact" variant={data.ok ? "secondary" : "primary"}>
                {data.ok ? <Link to="/applications">Your applications</Link> : <Link to="/passport">Open Passport</Link>}
              </Button>
            }
          />
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Submit work" description="Share links to what you delivered. The publisher reviews it." />
      <div className="mt-10 flex flex-col gap-10">
        <Field label="For" htmlFor="eligible">
          <SelectInput id="eligible" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
            {data.eligible.map((item) => (
              <option key={item.applicationId} value={item.applicationId}>
                {item.projectName} · {item.opportunityTitle}
              </option>
            ))}
          </SelectInput>
        </Field>
        <WorkForm applicationId={applicationId} />
      </div>
    </div>
  );
}
