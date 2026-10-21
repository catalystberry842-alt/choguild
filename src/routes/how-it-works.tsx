import * as Accordion from "@radix-ui/react-accordion";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { Section } from "@/components/ui/section";
import { TierBadge } from "@/components/ranking/bits";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ONCHAIN_XP_CAP, TIERS, XP_RULES } from "@/lib/ranking/xp";
import { CHOG_BOOST_CAP, CHOG_BOOST_RATE, CHOG_EXPLORER_URL } from "@/lib/chog/chog";

const CHOG_BOOST_PCT = Math.round(CHOG_BOOST_RATE * 100);
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  staticData: { title: "How it works", crumb: "How it works" },
  head: () => seo({ title: "How it works · Choguild", description: "Four steps to rank: claim a passport, find open work, submit proof, and climb the ladder on Monad.", path: "/how-it-works" }),
  component: HowItWorksPage,
});

const FLOW = [
  { title: "Connect a wallet", body: "Any browser wallet works. Connecting only shares an address, nothing else." },
  { title: "Sign and save a passport", body: "Sign one message (free, not a transaction). Add a username, bio, skills and links." },
  { title: "Find work on the board", body: "Filter opportunities by skill, category and pay. Apply with a short pitch." },
  { title: "Get accepted", body: "The publisher reviews applications and accepts the people they want to work with." },
  { title: "Submit the evidence", body: "Send links to the repo, doc or post. The publisher accepts it or asks for changes." },
  { title: "Climb the ranking", body: "Accepted work turns into XP on your passport and moves you up the ladder." },
] as const;

const FAQ = [
  {
    q: "Does connecting a wallet cost anything?",
    a: "No. Signing the Choguild message is not a transaction and never spends gas. Choguild never asks for a seed phrase or private key.",
  },
  {
    q: "Is a wallet address the same as a passport?",
    a: "No. An address is only an identifier. You become a guild member when you sign in and save a passport.",
  },
  {
    q: "Can I game the ranking?",
    a: "The big points come from submissions a publisher accepted. Publishing an opportunity only counts once it leaves draft.",
  },
  {
    q: "How does onchain XP work?",
    a: "We read how many transactions your passport wallet has sent on Monad mainnet. The score grows with the square root of that count and caps at 150 XP, about one accepted job, so steady activity counts but spamming transactions cannot outrank reviewed guild work. Your balance is never used.",
  },
  {
    q: "Who verifies the work?",
    a: "The person who published the opportunity reviews your submission. Links you provide stay marked as unverified until they accept them.",
  },
] as const;

function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-16">
      <PageHeader eyebrow="How it works" title="How it works" description="From wallet to accepted work, and how that becomes rank." />

      <Section title="The loop" description="Six steps, one record.">
        <ol className="flex flex-col">
          {FLOW.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 0.04} y={8} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-line py-5 sm:grid-cols-[4rem_16rem_minmax(0,1fr)]">
              <span className="t-h3 text-faint">{index + 1}</span>
              <h3 className="t-h3">{step.title}</h3>
              <p className="t-body col-start-2 sm:col-start-3">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section id="xp" title="XP" description="Recalculated live for every public passport.">
        <div className="scroll-mt-24 border-t border-line-strong">
          <table className="w-full text-left text-base">
            <thead className="t-label">
              <tr>
                <th className="py-3 pr-4 font-medium">Action</th>
                <th className="hidden py-3 pr-4 font-medium sm:table-cell">When it counts</th>
                <th className="py-3 pr-4 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {XP_RULES.map((rule) => (
                <tr key={rule.key} className="transition-colors hover:text-ink">
                  <td className="py-3 pr-4 font-medium text-ink">
                    {rule.label}
                    <span className="mt-0.5 block text-label font-normal text-muted sm:hidden">{rule.detail}</span>
                  </td>
                  <td className="hidden py-3 pr-4 text-body sm:table-cell">{rule.detail}</td>
                  <td className="py-3 pr-4 text-right font-medium tabular-nums text-signal">+{rule.points}</td>
                </tr>
              ))}
              <tr className="transition-colors hover:text-ink">
                <td className="py-3 pr-4 font-medium text-ink">
                  Onchain activity
                  <span className="mt-0.5 block text-label font-normal text-muted sm:hidden">
                    10 × √(transactions your wallet sent on Monad), up to {ONCHAIN_XP_CAP}.
                  </span>
                </td>
                <td className="hidden py-3 pr-4 text-body sm:table-cell">
                  10 × √(transactions your wallet sent on Monad mainnet), up to {ONCHAIN_XP_CAP}. 25 txs = 50 XP.
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums text-signal">≤{ONCHAIN_XP_CAP}</td>
              </tr>
              <tr className="transition-colors hover:text-ink">
                <td className="py-3 pr-4 font-medium text-ink">
                  Chog holder boost
                  <span className="mt-0.5 block text-label font-normal text-muted sm:hidden">
                    Hold a Chog Genesis NFT: +{CHOG_BOOST_PCT}% of guild XP, up to +{CHOG_BOOST_CAP}.
                  </span>
                </td>
                <td className="hidden py-3 pr-4 text-body sm:table-cell">
                  Hold at least one{" "}
                  <a href={CHOG_EXPLORER_URL} target="_blank" rel="noreferrer" className="t-link">Chog Genesis</a>{" "}
                  NFT in your passport wallet: +{CHOG_BOOST_PCT}% of guild XP (rounded), up to +{CHOG_BOOST_CAP}. Onchain XP is not
                  boosted. Holdings are read from Monad every few minutes.
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums text-signal">≤{CHOG_BOOST_CAP}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Ranks" description="Five tiers. Every one is earned.">
        <ol className="grid gap-x-6 border-t border-line sm:grid-cols-2 xl:grid-cols-3">
          {TIERS.map((tier, index) => (
            <li key={tier.name} className="border-b border-line py-5">
              <div className="flex items-center justify-between gap-2">
                <TierBadge tier={tier.name} />
                <span className="font-medium text-label tabular-nums text-muted">{tier.min}+ XP</span>
              </div>
              <div className="mt-3 flex gap-1" aria-hidden="true">
                {TIERS.map((_, dot) => (
                  <span key={dot} className={dot <= index ? "h-px flex-1 bg-signal" : "h-px flex-1 bg-line-strong"} />
                ))}
              </div>
              <p className="mt-3 text-base text-body">{tier.blurb}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Questions">
        <Accordion.Root type="single" collapsible className="divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <Accordion.Item key={item.q} value={item.q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-base text-ink transition-colors hover:text-signal">
                  {item.q}
                  <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="max-w-2xl pb-5 text-base text-body">{item.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Section>

      <section className="flex flex-col items-start justify-between gap-6 border-t border-line-strong pt-10 md:flex-row md:items-end">
        <div>
          <h2 className="t-h2">Ready to start?</h2>
          <p className="mt-1 text-body">It takes one signature and a short bio.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/passport">Create your passport</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/ranking">See the ranking</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
