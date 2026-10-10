import { Link, createFileRoute } from "@tanstack/react-router";
import { OpportunityCardView } from "@/components/board/opportunity-card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { listBoard } from "@/lib/board/functions";
import { emptyBoardSearch } from "@/lib/board/search";
import { completionSummary, profileCompletion } from "@/lib/passport/completion";
import { getPassportState } from "@/lib/passport/functions";
import { shortAddress } from "@/lib/passport/format";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [passport, board] = await Promise.all([
      getPassportState(),
      listBoard({ data: { ...emptyBoardSearch(), status: "all", page: 1 } }),
    ]);
    return { ...passport, featured: board.items.slice(0, 2) };
  },
  staticData: { title: "Home" },
  head: () => ({ meta: [{ title: "Home · Choguild" }] }),
  component: HomePage,
});

function HomePage() {
  const { sessionAddress, profile, featured } = Route.useLoaderData();
  const examplesOnly = featured.length > 0 && featured.every((item) => item.isDemo);
  const details = profile
    ? completionSummary(
        profileCompletion({
          biography: profile.biography,
          skills: profile.skills,
          portfolioUrl: profile.portfolioUrl,
          githubUrl: profile.githubUrl,
          xUrl: profile.xUrl,
          otherLinks: profile.otherLinks,
          avatarUrl: profile.avatarUrl,
        }),
      )
    : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Contributor guild on Monad</p>
        <h1 className="mt-2 text-4xl leading-[1.05] font-bold tracking-tight text-ink sm:text-[2.5rem]">
          Show the work.
          <br />
          Wear the name.
        </h1>
        <p className="mt-3 max-w-lg text-[17px] leading-6 text-body">
          A passport for your name, a board of opportunities, and a record of accepted work.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="compact" className="px-2.5 text-[13px] sm:px-3 sm:text-sm">
            <Link to="/discover" search={emptyBoardSearch()}>Explore opportunities</Link>
          </Button>
          <Button asChild variant="secondary" size="compact" className="px-2.5 text-[13px] sm:px-3 sm:text-sm">
            <Link to="/passport">{profile ? "Your Passport" : "Create your Passport"}</Link>
          </Button>
        </div>
        <p className="mt-3 text-sm leading-5 text-muted">
          {profile
            ? `${profile.displayName} is signed in as @${profile.username}. ${details}`
            : sessionAddress
              ? `${shortAddress(sessionAddress)} is signed in, and the passport is not saved yet.`
              : "No passport session. Connecting a wallet does not create one."}{" "}
          <Link to="/network" className="font-semibold text-sand">Network status</Link>
        </p>
      </section>

      <section id="featured" className="scroll-mt-[4.5rem]">
        <SectionHeader
          title={examplesOnly ? "Featured examples" : "On the board"}
          action={
            <Button asChild variant="secondary" size="compact">
              <Link to="/discover" search={emptyBoardSearch()}>View all</Link>
            </Button>
          }
        >
          {examplesOnly
            ? "These listings show the board. They are demo content and do not accept applications."
            : "Live opportunities are listed with any remaining examples. Demo listings do not accept applications."}
        </SectionHeader>
        <ul className="mt-2 grid gap-2">
          {featured.map((item) => (
            <OpportunityCardView key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </div>
  );
}
