import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { FormSection } from "@/components/ui/form-section";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/input";
import {
  BOARD_SKILLS,
  CATEGORIES,
  CATEGORY_LABEL,
  COMPENSATION_LABEL,
  COMPENSATION_NOTE,
  COMPENSATION_TYPES,
} from "@/lib/board/copy";
import { createBoardOpportunity, saveBoardOpportunity } from "@/lib/board/functions";
import type { OpportunityDetail } from "@/lib/board/types";
import { type BoardErrors, type OpportunityInput } from "@/lib/board/validate";
import { cn } from "@/lib/cn";

function emptyInput(): OpportunityInput {
  return {
    projectName: "",
    projectLogoUrl: "",
    title: "",
    summary: "",
    description: "",
    scope: "",
    deliverables: "",
    requiredSkills: [],
    preferredSkills: [],
    category: "content",
    compensationType: "unpaid",
    compensationDetails: "",
    timeCommitment: "",
    deadline: "",
    instructions: "",
    question: "",
    positions: "",
    publish: false,
    holdersOnly: false,
  };
}

function fromOpportunity(opportunity: OpportunityDetail): OpportunityInput {
  return {
    projectName: opportunity.projectName,
    projectLogoUrl: opportunity.projectLogoUrl ?? "",
    title: opportunity.title,
    summary: opportunity.summary,
    description: opportunity.description,
    scope: opportunity.scope,
    deliverables: opportunity.deliverables,
    requiredSkills: opportunity.requiredSkills,
    preferredSkills: opportunity.preferredSkills,
    category: opportunity.category,
    compensationType: opportunity.compensationType,
    compensationDetails: opportunity.compensationDetails ?? "",
    timeCommitment: opportunity.timeCommitment ?? "",
    deadline: opportunity.deadline ? opportunity.deadline.slice(0, 10) : "",
    instructions: opportunity.instructions,
    question: opportunity.question ?? "",
    positions: opportunity.positions ? String(opportunity.positions) : "",
    publish: opportunity.status === "open",
    holdersOnly: opportunity.holdersOnly,
  };
}

export function OpportunityForm({ opportunity }: { opportunity?: OpportunityDetail }) {
  const navigate = useNavigate();
  const create = useServerFn(createBoardOpportunity);
  const save = useServerFn(saveBoardOpportunity);
  const [form, setForm] = useState<OpportunityInput>(() => (opportunity ? fromOpportunity(opportunity) : emptyInput()));
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [errors, setErrors] = useState<BoardErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const note = COMPENSATION_NOTE[form.compensationType as keyof typeof COMPENSATION_NOTE];

  function set<K extends keyof OpportunityInput>(key: K, value: OpportunityInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggle(key: "requiredSkills" | "preferredSkills", skill: string) {
    setForm((current) => {
      const has = current[key].some((item) => item.toLowerCase() === skill.toLowerCase());
      return { ...current, [key]: has ? current[key].filter((item) => item.toLowerCase() !== skill.toLowerCase()) : [...current[key], skill] };
    });
  }

  async function submit(publish: boolean) {
    setPending(true);
    setFormError(null);
    const payload = { ...form, publish };
    const result = opportunity
      ? await save({ data: { id: opportunity.id, opportunity: payload } })
      : await create({ data: payload });
    setPending(false);
    if (!result.ok) {
      setErrors("fieldErrors" in result ? result.fieldErrors ?? {} : {});
      setFormError(result.error);
      setStep("edit");
      return;
    }
    await navigate({ to: "/discover/$opportunityId", params: { opportunityId: result.opportunity.id } });
  }

  if (step === "review") {
    return (
      <div className="passport-glass rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="t-h2">Review before <em>publishing</em></h2>
        <dl className="mt-4 grid gap-3 text-base">
          <div><dt className="text-muted">Title</dt><dd className="text-ink">{form.title}</dd></div>
          <div><dt className="text-muted">Project</dt><dd className="text-ink">{form.projectName}</dd></div>
          <div><dt className="text-muted">Summary</dt><dd className="text-ink">{form.summary}</dd></div>
          <div><dt className="text-muted">Compensation</dt><dd className="text-ink">{COMPENSATION_LABEL[form.compensationType as keyof typeof COMPENSATION_LABEL]} {form.compensationDetails}</dd></div>
          <div><dt className="text-muted">Who can apply</dt><dd className="text-ink">{form.holdersOnly ? "Chog Genesis holders only" : "Anyone with a passport"}</dd></div>
          <div><dt className="text-muted">Required skills</dt><dd className="text-ink">{form.requiredSkills.join(", ") || "None"}</dd></div>
        </dl>
        {formError ? <div className="mt-4"><ErrorMessage title="Could not publish">{formError}</ErrorMessage></div> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => void submit(true)}>{pending ? "Publishing" : "Publish"}</Button>
          <Button variant="secondary" disabled={pending} onClick={() => void submit(false)}>Save draft</Button>
          <Button variant="ghost" disabled={pending} onClick={() => setStep("edit")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        setStep("review");
      }}
    >
      {formError ? <ErrorMessage title="Could not save">{formError}</ErrorMessage> : null}
      <FormSection title="Basics" description="Title, project, and what the work is.">
        <Field label="Title" htmlFor="opp-title" error={errors.title}>
          <TextInput id="opp-title" value={form.title} onChange={(event) => set("title", event.target.value)} required />
        </Field>
        <Field label="Project or organization" htmlFor="opp-project" error={errors.projectName}>
          <TextInput id="opp-project" value={form.projectName} onChange={(event) => set("projectName", event.target.value)} required />
        </Field>
        <Field label="Logo URL" htmlFor="opp-logo" hint="Optional https image URL (not a profile page)." error={errors.projectLogoUrl}>
          <TextInput id="opp-logo" value={form.projectLogoUrl} onChange={(event) => set("projectLogoUrl", event.target.value)} />
        </Field>
        <Field label="Short summary" htmlFor="opp-summary" error={errors.summary}>
          <TextArea id="opp-summary" value={form.summary} onChange={(event) => set("summary", event.target.value)} required />
        </Field>
        <Field label="Full description" htmlFor="opp-description" error={errors.description}>
          <TextArea id="opp-description" value={form.description} onChange={(event) => set("description", event.target.value)} required />
        </Field>
      </FormSection>

      <FormSection title="The brief" description="Scope, deliverables, and skills.">
        <Field label="Scope of work" htmlFor="opp-scope" error={errors.scope}>
          <TextArea id="opp-scope" value={form.scope} onChange={(event) => set("scope", event.target.value)} required />
        </Field>
        <Field label="Deliverables" htmlFor="opp-deliverables" error={errors.deliverables}>
          <TextArea id="opp-deliverables" value={form.deliverables} onChange={(event) => set("deliverables", event.target.value)} required />
        </Field>
        <SkillPicker label="Required skills" selected={form.requiredSkills} error={errors.requiredSkills} onToggle={(skill) => toggle("requiredSkills", skill)} />
        <SkillPicker label="Preferred skills" selected={form.preferredSkills} error={errors.preferredSkills} onToggle={(skill) => toggle("preferredSkills", skill)} />
      </FormSection>

      <FormSection title="Terms" description="Pay, timing, and who can apply.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="opp-category" error={errors.category}>
            <SelectInput id="opp-category" value={form.category} onChange={(event) => set("category", event.target.value)}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABEL[item]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Compensation type" htmlFor="opp-comp" error={errors.compensationType}>
            <SelectInput id="opp-comp" value={form.compensationType} onChange={(event) => set("compensationType", event.target.value)}>
              {COMPENSATION_TYPES.map((item) => <option key={item} value={item}>{COMPENSATION_LABEL[item]}</option>)}
            </SelectInput>
          </Field>
        </div>
        {note ? <p className="text-base text-muted">{note}</p> : null}
        <Field label="Compensation details" htmlFor="opp-details" hint="Required unless the work is unpaid." error={errors.compensationDetails}>
          <TextArea id="opp-details" value={form.compensationDetails} onChange={(event) => set("compensationDetails", event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time commitment" htmlFor="opp-time" hint="Optional." error={errors.timeCommitment}>
            <TextInput id="opp-time" value={form.timeCommitment} onChange={(event) => set("timeCommitment", event.target.value)} />
          </Field>
          <Field label="Application deadline" htmlFor="opp-deadline" hint="Optional." error={errors.deadline}>
            <TextInput id="opp-deadline" type="date" value={form.deadline} onChange={(event) => set("deadline", event.target.value)} />
          </Field>
        </div>
        <Field label="Positions" htmlFor="opp-positions" hint="Optional. 1–20." error={errors.positions}>
          <TextInput id="opp-positions" inputMode="numeric" value={form.positions} onChange={(event) => set("positions", event.target.value)} />
        </Field>
        <label htmlFor="opp-holders-only" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line-strong bg-black/20 p-4 transition-colors hover:border-signal/40">
          <input
            id="opp-holders-only"
            type="checkbox"
            checked={form.holdersOnly === true}
            onChange={(event) => set("holdersOnly", event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--color-signal)]"
          />
          <span>
            <span className="block text-base font-medium text-ink">Chog holders only</span>
            <span className="t-meta mt-0.5 block">
              Only wallets holding a Chog Genesis NFT can apply. Checked onchain on Monad when they apply.
            </span>
          </span>
        </label>
      </FormSection>

      <FormSection title="How to apply">
        <Field label="Application instructions" htmlFor="opp-instructions" error={errors.instructions}>
          <TextArea id="opp-instructions" value={form.instructions} onChange={(event) => set("instructions", event.target.value)} required />
        </Field>
        <Field label="Question for applicants" htmlFor="opp-question" hint="Optional." error={errors.question}>
          <TextInput id="opp-question" value={form.question} onChange={(event) => set("question", event.target.value)} />
        </Field>
      </FormSection>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">Review</Button>
      </div>
    </form>
  );
}

function SkillPicker({
  label,
  selected,
  error,
  onToggle,
}: {
  label: string;
  selected: string[];
  error?: string;
  onToggle: (skill: string) => void;
}) {
  const [custom, setCustom] = useState("");
  return (
    <fieldset>
      <legend className="text-small font-medium text-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {BOARD_SKILLS.map((skill) => {
          const on = selected.some((item) => item.toLowerCase() === skill.toLowerCase());
          return (
            <button
              key={skill}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(skill)}
              className={cn(
                "min-h-11 rounded-full border px-3.5 text-base transition-colors",
                on ? "border-signal/60 bg-signal/15 text-ink" : "border-line bg-black/20 text-body hover:border-signal/40",
              )}
            >
              {skill}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <TextInput value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Add a skill" aria-label={`Add to ${label}`} />
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const skill = custom.trim();
            if (!skill) return;
            onToggle(skill);
            setCustom("");
          }}
        >
          Add
        </Button>
      </div>
      {error ? <p className="mt-2 text-label text-danger" role="alert">{error}</p> : null}
    </fieldset>
  );
}
