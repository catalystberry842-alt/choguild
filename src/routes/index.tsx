import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Compass, IdCard, ScrollText } from "lucide-react";
import { Logo } from "@/components/brand/logo";
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
    <div className="flex flex-col gap-12">
      <section className="relative grid items-center gap-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-elevated via-canvas to-secondary/60 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-2xl stagger">
          <p className="inline-flex items-center gap-2 rounded-full border border-action/40 bg-action/10 px-3 py-1 text-xs font-semibold tracking-wide text-sand uppercase">
            <span className="pulse-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
            Contributor guild on Monad
          </p>
          <h1 className="mt-4 text-[2.6rem] leading-[1.02] font-bold text-ink sm:text-6xl">
            Show the work.
            <br />
            <span className="text-gradient">Wear the name.</span>
          </h1>
          <p className="mt-4 max-w-lg text-[17px] leading-7 text-body">
            A passport for your name, a board of opportunities, and a record of accepted work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/discover" search={emptyBoardSearch()}>
                Explore opportunities
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/passport">{profile ? "Your Passport" : "Create your Passport"}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm leading-5 text-muted">
            {profile
              ? `${profile.displayName} is signed in as @${profile.username}. ${details}`
              : sessionAddress
                ? `${shortAddress(sessionAddress)} is signed in, and the passport is not saved yet.`
                : "No passport session. Connecting a wallet does not create one."}{" "}
            <Link to="/network" className="font-semibold text-sand hover:text-sand-hover">Network status</Link>
          </p>
        </div>
        <div className="relative order-first mx-auto w-28 sm:w-40 md:order-none md:w-64" aria-hidden="true">
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-action to-pink opacity-50 blur-3xl" />
          <Logo float className="relative rotate-2 [&_img]:rounded-3xl [&_img]:shadow-[0_20px_60px_-20px_rgb(236_72_153_/_0.8)]" />
        </div>
      </section>

      <section>
        <SectionHeader title="How the guild works">Three steps from wallet to reputation.</SectionHeader>
        <ol className="stagger mt-4 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title}>
                <Link
                  to={step.to}
                  className="card-pop group flex h-full flex-col gap-3 rounded-2xl border border-line bg-elevated/80 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-action to-pink text-on-accent shadow-[0_6px_20px_-8px_rgb(236_72_153_/_0.8)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-3xl font-bold text-line">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="text-sm leading-6 text-body">{step.body}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-sand">
                    {step.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
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
        <ul className="stagger mt-4 grid gap-3">
          {featured.map((item) => (
            <OpportunityCardView key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </div>
  );
}

const STEPS = [
  {
    title: "Claim your passport",
    body: "Sign a message with your wallet and save a public profile with your skills and links.",
    cta: "Open passport",
    to: "/passport",
    icon: IdCard,
  },
  {
    title: "Find open work",
    body: "Browse the board, filter by skill and compensation, and apply to what fits.",
    cta: "Discover",
    to: "/discover",
    icon: Compass,
  },
  {
    title: "Ship and get reviewed",
    body: "Submit evidence once you are accepted. Reviewed work builds your contribution history.",
    cta: "Submissions",
    to: "/submissions",
    icon: ScrollText,
  },
] as const;
