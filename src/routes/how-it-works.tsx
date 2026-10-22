import * as Accordion from "@radix-ui/react-accordion";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { Section } from "@/components/ui/section";
import { TierBadge } from "@/components/ranking/bits";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TIERS, XP_RULES } from "@/lib/ranking/xp";
import { QUESTS, STREAK_BONUS_CAP } from "@/lib/quests/quests";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  staticData: { title: "How it works", crumb: "How it works" },
  head: () => seo({ title: "How it works · Choguild", description: "Your Chog Genesis NFT is the member: act as it, quest daily, take work and climb. The record travels with the token.", path: "/how-it-works" }),
  component: HowItWorksPage,
});

const FLOW = [
  { title: "Hold a Chog Genesis", body: "The Chog is the membership. A wallet with no Chog can browse everything but can't act." },
  { title: "Sign in and pick a Chog", body: "Sign one free message, then choose which Chog you hold to act as. Ownership is read live with ownerOf." },
  { title: "Save its passport", body: "Name, bio, skills and links, saved on the token. The face is always the Chog's own art." },
  { title: "Quest daily", body: "Check in, scout a listing, visit a rival. Check-ins build a streak with bonus XP." },
  { title: "Take and post work", body: "Chogs post listings, other Chogs apply and submit evidence. The poster accepts or asks for changes." },
  { title: "Climb, and pass it on", body: "XP, tier and history live on the Chog. Transfer it and the new holder inherits the record." },
] as const;

const FAQ = [
  {
    q: "Why is the NFT the member and not my wallet?",
    a: "Because a Chog's record should be worth something. Rank, tier and accepted work are keyed to the token id, so a seasoned Chog carries its history to whoever holds it next.",
  },
  {
    q: "What happens when I sell or send my Chog?",
    a: "Every action re-checks ownerOf on Monad. The moment the token leaves your wallet you stop acting as it, and the new holder can act as it with its full record, passport text included (they can edit it).",
  },
  {
    q: "I hold several Chogs. Can I farm with them?",
    a: "Chogs held by the same wallet can't hire, accept or review each other, earn no XP from each other, and only one of them can do each daily quest per day.",
  },
  {
    q: "I had a wallet passport before. Where did it go?",
    a: "If the wallet held a Chog when we migrated, the passport and its history moved onto that wallet's lowest-numbered Chog. Otherwise it was archived; act as a Chog from that wallet and it is moved onto that Chog.",
  },
  {
    q: "Does signing cost anything?",
    a: "No. Signing the Choguild message is not a transaction and never spends gas. Choguild never asks for a seed phrase or private key.",
  },
] as const;

function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-16">
      <PageHeader title={<>Your Chog is the <em>member.</em></>} description="How a Chog joins, earns XP and carries its record to its next holder." />

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

      <Section id="xp" title="XP" description="Recalculated live for every Chog with a public passport.">
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
              {QUESTS.map((q) => (
                <tr key={q.id} className="transition-colors hover:text-ink">
                  <td className="py-3 pr-4 font-medium text-ink">
                    Daily quest: {q.label}
                    <span className="mt-0.5 block text-label font-normal text-muted sm:hidden">{q.detail}</span>
                  </td>
                  <td className="hidden py-3 pr-4 text-body sm:table-cell">
                    {q.detail} Once per Chog per UTC day, and one Chog per wallet per quest.
                    {q.id === "checkin" ? ` Streak bonus +1 XP per consecutive day, up to +${STREAK_BONUS_CAP}.` : ""}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium tabular-nums text-signal">+{q.xp}{q.id === "checkin" ? "+" : ""}</td>
                </tr>
              ))}
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
