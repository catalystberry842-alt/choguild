import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkForm } from "@/components/work/work-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SelectInput } from "@/components/ui/input";
import { getWorkHome } from "@/lib/work/functions";
import { useState } from "react";

export const Route = createFileRoute("/submissions/new")({
  loader: () => getWorkHome(),
  staticData: { title: "New submission", crumb: "New submission" },
  head: () => ({ meta: [{ title: "New submission · Choguild" }] }),
  component: NewSubmissionPage,
});

function NewSubmissionPage() {
  const data = Route.useLoaderData();
  const [applicationId, setApplicationId] = useState(data.eligible[0]?.applicationId ?? "");
  if (!data.ok) {
    return <EmptyState title="Sign in to submit work" body={data.error} action={<Button asChild><Link to="/passport">Open passport</Link></Button>} />;
  }
  if (data.eligible.length === 0) {
    return (
      <EmptyState
        title="No accepted application to attach"
        body="Work is submitted against an application a creator has accepted. Example listings and open applications do not qualify."
        action={<Button asChild><Link to="/applications">View applications</Link></Button>}
      />
    );
  }
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Evidence</p>
      <h1 className="mt-2 text-3xl text-ink">Submit work</h1>
      <label className="mt-6 block text-sm font-medium text-ink" htmlFor="eligible">Accepted application</label>
      <SelectInput id="eligible" className="mt-2" value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
        {data.eligible.map((item) => (
          <option key={item.applicationId} value={item.applicationId}>{item.projectName} — {item.opportunityTitle}</option>
        ))}
      </SelectInput>
      <div className="mt-6">
        <WorkForm applicationId={applicationId} />
      </div>
    </div>
  );
}
