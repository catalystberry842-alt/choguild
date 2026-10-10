import * as Accordion from "@radix-ui/react-accordion";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Compass, FileCheck2, IdCard, Inbox, Trophy, Wallet } from "lucide-react";
import { TierBadge } from "@/components/ranking/bits";
import { Button } from "@/components/ui/button";
import { TIERS, XP_RULES } from "@/lib/ranking/xp";

export const Route = createFileRoute("/how-it-works")({
  staticData: { title: "How it works", crumb: "How it works" },
  head: () => ({ meta: [{ title: "How it works · Choguild" }] }),
  component: HowItWorksPage,
});

const FLOW = [
  { icon: Wallet, title: "Connect a wallet", body: "Any browser wallet works. Connecting only shares an address, nothing else." },
  { icon: IdCard, title: "Sign and save a passport", body: "Sign one message (free, not a transaction). Add a username, bio, skills and links." },
  { icon: Compass, title: "Find work on the board", body: "Filter opportunities by skill, category and pay. Apply with a short pitch." },
  { icon: Inbox, title: "Get accepted", body: "The publisher reviews applications and accepts the people they want to work with." },
  { icon: FileCheck2, title: "Submit the evidence", body: "Send links to the repo, doc or post. The publisher accepts it or asks for changes." },
  { icon: Trophy, title: "Climb the ranking", body: "Accepted work turns into XP on your passport and moves you up the ladder." },
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
    a: "The big points come from submissions a publisher accepted. Publishing opportunities only counts when they leave draft, and demo listings never count.",
  },
  {
    q: "Who verifies the work?",
    a: "The person who published the opportunity reviews your submission. Links you provide stay marked as unverified until they accept them.",
  },
  {
    q: "What are the demo listings?",
    a: "Example opportunities that show how the board looks. They do not accept applications and award no XP.",
  },
] as const;

function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-14">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-sand uppercase">Guide</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">How the guild works</h1>
        <p className="mt-3 text-body">
          Choguild is a place to prove what you have shipped in the Monad ecosystem. Here is the whole loop, how XP is
          counted, and what each rank means.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-bold text-ink">The loop</h2>
        <ol className="stagger relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="card-pop rounded-xl border border-line bg-elevated p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-action/15 text-sand ring-1 ring-action/40">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-muted">step {String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-body">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="xp" className="scroll-mt-24">
        <h2 className="text-xl font-bold text-ink">How XP is counted</h2>
        <p className="mt-1 text-sm text-body">Only public passports appear on the ranking. XP is recalculated live from the board.</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-elevated text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">When it counts</th>
                <th className="px-4 py-3 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {XP_RULES.map((rule) => (
                <tr key={rule.key} className="transition-colors hover:bg-elevated">
                  <td className="px-4 py-3 font-medium text-ink">
                    {rule.label}
                    <span className="mt-0.5 block text-xs font-normal text-muted sm:hidden">{rule.detail}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-body sm:table-cell">{rule.detail}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-sand">+{rule.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink">Ranks</h2>
        <ol className="stagger mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TIERS.map((tier, index) => (
            <li key={tier.name} className="rounded-xl border border-line bg-elevated p-4">
              <div className="flex items-center justify-between gap-2">
                <TierBadge tier={tier.name} />
                <span className="font-mono text-xs text-muted">{tier.min}+ XP</span>
              </div>
              <div className="mt-3 flex gap-1" aria-hidden="true">
                {TIERS.map((_, dot) => (
                  <span key={dot} className={dot <= index ? "h-1 flex-1 rounded-full bg-action" : "h-1 flex-1 rounded-full bg-secondary"} />
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-body">{tier.blurb}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink">Questions</h2>
        <Accordion.Root type="single" collapsible className="mt-4 divide-y divide-line rounded-xl border border-line">
          {FAQ.map((item) => (
            <Accordion.Item key={item.q} value={item.q}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-medium text-ink transition-colors hover:bg-elevated">
                  {item.q}
                  <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 text-sm leading-6 text-body">{item.a}</Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </section>

      <section className="dot-grid flex flex-col items-start gap-4 rounded-2xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-2xl font-bold text-ink">Ready to get on the ladder?</h2>
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
