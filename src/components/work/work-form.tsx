import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, TextArea, TextInput } from "@/components/ui/input";
import { createWorkItem, reviseWorkItem } from "@/lib/work/functions";
import type { WorkDetail } from "@/lib/work/types";
import type { WorkErrors, WorkInput } from "@/lib/work/validate";

function fromWork(work?: WorkDetail): WorkInput {
  const latest = work?.versions[work.versions.length - 1];
  return {
    title: latest?.title ?? "",
    description: latest?.description ?? "",
    evidenceLinks: latest?.evidenceLinks.length ? latest.evidenceLinks : [""],
    repoUrl: latest?.repoUrl ?? "",
    documentUrl: latest?.documentUrl ?? "",
    notes: latest?.notes ?? "",
    publicEvidence: work?.publicEvidence ?? true,
    submit: true,
  };
}

export function WorkForm({ applicationId, work }: { applicationId?: string; work?: WorkDetail }) {
  const navigate = useNavigate();
  const create = useServerFn(createWorkItem);
  const revise = useServerFn(reviseWorkItem);
  const [form, setForm] = useState<WorkInput>(() => fromWork(work));
  const [errors, setErrors] = useState<WorkErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function send(submit: boolean) {
    setPending(true);
    setFormError(null);
    const payload = { ...form, submit };
    const result = work
      ? await revise({ data: { id: work.id, work: payload } })
      : await create({ data: { applicationId: applicationId ?? "", work: payload } });
    setPending(false);
    if (!result.ok) {
      setErrors("fieldErrors" in result ? result.fieldErrors ?? {} : {});
      setFormError(result.error);
      return;
    }
    await navigate({ to: "/submissions/$submissionId", params: { submissionId: result.work.id } });
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void send(true); }}>
      {formError ? <ErrorMessage title="Submission was not saved">{formError}</ErrorMessage> : null}
      <Field label="Title" htmlFor="work-title" error={errors.title}>
        <TextInput id="work-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      </Field>
      <Field label="What you completed" htmlFor="work-body" error={errors.description}>
        <TextArea id="work-body" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
      </Field>
      <fieldset>
        <legend className="text-sm font-medium text-ink">Evidence links</legend>
        <div className="mt-2 grid gap-2">
          {form.evidenceLinks.map((link, index) => (
            <TextInput
              key={index}
              aria-label={`Evidence link ${index + 1}`}
              value={link}
              placeholder="https://"
              onChange={(event) => {
                const evidenceLinks = [...form.evidenceLinks];
                evidenceLinks[index] = event.target.value;
                setForm({ ...form, evidenceLinks });
              }}
            />
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-2" onClick={() => setForm({ ...form, evidenceLinks: [...form.evidenceLinks, ""] })}>Add a link</Button>
        {errors.evidenceLinks ? <p className="mt-2 text-xs text-danger" role="alert">{errors.evidenceLinks}</p> : null}
      </fieldset>
      <Field label="Repository or pull request" htmlFor="work-repo" hint="Optional https link. Not verified by itself." error={errors.repoUrl}>
        <TextInput id="work-repo" value={form.repoUrl} onChange={(event) => setForm({ ...form, repoUrl: event.target.value })} />
      </Field>
      <Field label="Document" htmlFor="work-doc" hint="Optional https link." error={errors.documentUrl}>
        <TextInput id="work-doc" value={form.documentUrl} onChange={(event) => setForm({ ...form, documentUrl: event.target.value })} />
      </Field>
      <Field label="Notes" htmlFor="work-notes" hint="Optional." error={errors.notes}>
        <TextArea id="work-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-body">
        <input type="checkbox" className="mt-1" checked={form.publicEvidence} onChange={(event) => setForm({ ...form, publicEvidence: event.target.checked })} />
        If this is accepted, show the evidence links on my public passport.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving" : work?.status === "changes_requested" ? "Send revision" : "Submit"}</Button>
        {work?.status !== "changes_requested" ? (
          <Button type="button" variant="secondary" disabled={pending} onClick={() => void send(false)}>Save draft</Button>
        ) : null}
      </div>
    </form>
  );
}
