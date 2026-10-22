import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { NotFoundState } from "@/components/layout/not-found";
import { getPublicProfile } from "@/lib/passport/functions";

/** v3: passports live on the Chog. Old /passport/:username links forward to /chog/:id. */
export const Route = createFileRoute("/passport/$username")({
  loader: async ({ params }) => {
    const profile = await getPublicProfile({ data: params.username });
    if (!profile) throw notFound();
    if (profile.chogId) throw redirect({ to: "/chog/$chogId", params: { chogId: String(profile.chogId) }, statusCode: 301 });
    return { profile };
  },
  staticData: { title: "Archived passport", crumb: "Passport" },
  component: () => (
    <NotFoundState
      title="Archived wallet passport"
      description="Choguild members are Chogs now. This wallet passport had no Chog, so it is archived. If its wallet acts as a Chog, the record moves onto that Chog."
    />
  ),
  notFoundComponent: () => <NotFoundState title="Passport not found" description="Check the username and try again." />,
});
