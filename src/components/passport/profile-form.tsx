import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { usePassport } from "@/components/passport/passport-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/input";
import { completionSummary, profileCompletion } from "@/lib/passport/completion";
import { SUGGESTED_SKILLS, USERNAME_HINT } from "@/lib/passport/copy";
import { saveProfile } from "@/lib/passport/functions";
import { LIMITS, type FieldErrors, type OtherLink, type ProfileInput } from "@/lib/passport/validate";
import type { PublicProfile } from "@/lib/passport/types";
import { cn } from "@/lib/cn";

function emptyLink(): OtherLink {
  return { label: "", url: "" };
}

function fromProfile(profile: PublicProfile | null): ProfileInput {
  return {
    username: profile?.username ?? "",
    displayName: profile?.displayName ?? "",
    biography: profile?.biography ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    skills: profile?.skills ?? [],
    portfolioUrl: profile?.portfolioUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    xUrl: profile?.xUrl ?? "",
    otherLinks: profile?.otherLinks.length ? profile.otherLinks : [emptyLink()],
    interests: profile?.interests ?? "",
    visibility: profile?.visibility ?? "public",
  };
}

export function ProfileForm({ mode, profile }: { mode: "create" | "update"; profile: PublicProfile | null }) {
  const save = useServerFn(saveProfile);
  const { refresh } = usePassport();
  const [form, setForm] = useState<ProfileInput>(() => fromProfile(profile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");

  const completion = profileCompletion({
    biography: form.biography,
    skills: form.skills,
    portfolioUrl: form.portfolioUrl.trim() || null,
    githubUrl: form.githubUrl.trim() || null,
    xUrl: form.xUrl.trim() || null,
    otherLinks: form.otherLinks.filter((link) => link.url.trim()),
    avatarUrl: form.avatarUrl.trim() || null,
  });

  function patch(partial: Partial<ProfileInput>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function toggleSkill(skill: string) {
    setForm((current) => {
      const exists = current.skills.some((item) => item.toLowerCase() === skill.toLowerCase());
      return {
        ...current,
        skills: exists
          ? current.skills.filter((item) => item.toLowerCase() !== skill.toLowerCase())
          : [...current.skills, skill],
      };
    });
  }

  function addSkill() {
    const next = skillDraft.trim();
    if (!next) return;
    toggleSkill(next);
    setSkillDraft("");
  }

  function updateLink(index: number, partial: Partial<OtherLink>) {
    setForm((current) => ({
      ...current,
      otherLinks: current.otherLinks.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...partial } : link,
      ),
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError(null);
    setErrors({});
    try {
      const result = await save({
        data: {
          mode,
          profile: {
            ...form,
            otherLinks: form.otherLinks.filter((link) => link.label.trim() || link.url.trim()),
          },
        },
      });
      if (!result.ok) {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
        return;
      }
      await refresh();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Your Passport couldn't be saved. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <Field label="Username" htmlFor="passport-username" hint={USERNAME_HINT} error={errors.username}>
        <TextInput
          id="passport-username"
          value={form.username}
          onChange={(event) => patch({ username: event.target.value })}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={LIMITS.usernameMax}
          aria-invalid={Boolean(errors.username)}
          required
        />
      </Field>
      <Field
        label="Display name"
        htmlFor="passport-display-name"
        error={errors.displayName}
        hint={`Up to ${LIMITS.displayNameMax} characters.`}
      >
        <TextInput
          id="passport-display-name"
          value={form.displayName}
          onChange={(event) => patch({ displayName: event.target.value })}
          maxLength={LIMITS.displayNameMax}
          aria-invalid={Boolean(errors.displayName)}
          required
        />
      </Field>
      <Field
        label="Biography"
        htmlFor="passport-bio"
        error={errors.biography}
        hint={`Up to ${LIMITS.biographyMax} characters.`}
      >
        <TextArea
          id="passport-bio"
          value={form.biography}
          onChange={(event) => patch({ biography: event.target.value })}
          maxLength={LIMITS.biographyMax}
          aria-invalid={Boolean(errors.biography)}
          required
        />
      </Field>
      <Field label="Avatar URL" htmlFor="passport-avatar" error={errors.avatarUrl} hint="Optional https image URL.">
        <TextInput
          id="passport-avatar"
          value={form.avatarUrl}
          onChange={(event) => patch({ avatarUrl: event.target.value })}
          inputMode="url"
          maxLength={LIMITS.urlMax}
          aria-invalid={Boolean(errors.avatarUrl)}
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Skills</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.map((skill) => {
            const selected = form.skills.some((item) => item.toLowerCase() === skill.toLowerCase());
            return (
              <button
                key={skill}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "min-h-11 rounded-md border px-3 text-sm",
                  selected
                    ? "border-action bg-elevated text-ink"
                    : "border-line bg-canvas text-body hover:text-ink",
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <TextInput
            aria-label="Custom skill"
            value={skillDraft}
            onChange={(event) => setSkillDraft(event.target.value)}
            maxLength={LIMITS.skillMax}
            placeholder="Add another skill"
          />
          <Button type="button" variant="secondary" onClick={addSkill}>
            Add skill
          </Button>
        </div>
        {form.skills.length > 0 ? (
          <p className="mt-2 text-sm text-body">{form.skills.join(", ")}</p>
        ) : null}
        {errors.skills ? (
          <p className="mt-2 text-xs text-danger" role="alert">
            {errors.skills}
          </p>
        ) : null}
      </fieldset>

      <Field label="Portfolio URL" htmlFor="passport-portfolio" error={errors.portfolioUrl} hint="Optional https URL.">
        <TextInput
          id="passport-portfolio"
          value={form.portfolioUrl}
          onChange={(event) => patch({ portfolioUrl: event.target.value })}
          inputMode="url"
          maxLength={LIMITS.urlMax}
          aria-invalid={Boolean(errors.portfolioUrl)}
        />
      </Field>
      <Field label="GitHub URL" htmlFor="passport-github" error={errors.githubUrl} hint="Optional https://github.com/username">
        <TextInput
          id="passport-github"
          value={form.githubUrl}
          onChange={(event) => patch({ githubUrl: event.target.value })}
          inputMode="url"
          maxLength={LIMITS.urlMax}
          aria-invalid={Boolean(errors.githubUrl)}
        />
      </Field>
      <Field label="X URL" htmlFor="passport-x" error={errors.xUrl} hint="Optional https://x.com/username">
        <TextInput
          id="passport-x"
          value={form.xUrl}
          onChange={(event) => patch({ xUrl: event.target.value })}
          inputMode="url"
          maxLength={LIMITS.urlMax}
          aria-invalid={Boolean(errors.xUrl)}
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Other links</legend>
        <div className="mt-3 flex flex-col gap-3">
          {form.otherLinks.map((link, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2">
              <TextInput
                aria-label={`Link ${index + 1} label`}
                value={link.label}
                onChange={(event) => updateLink(index, { label: event.target.value })}
                maxLength={LIMITS.linkLabelMax}
                placeholder="Label"
              />
              <TextInput
                aria-label={`Link ${index + 1} URL`}
                value={link.url}
                onChange={(event) => updateLink(index, { url: event.target.value })}
                inputMode="url"
                maxLength={LIMITS.urlMax}
                placeholder="https://"
              />
            </div>
          ))}
        </div>
        {form.otherLinks.length < LIMITS.otherLinkCount ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-2"
            onClick={() => patch({ otherLinks: [...form.otherLinks, emptyLink()] })}
          >
            Add another link
          </Button>
        ) : null}
        {errors.otherLinks ? (
          <p className="mt-2 text-xs text-danger" role="alert">
            {errors.otherLinks}
          </p>
        ) : null}
      </fieldset>

      <Field label="Interests" htmlFor="passport-interests" error={errors.interests} hint="Optional.">
        <TextInput
          id="passport-interests"
          value={form.interests}
          onChange={(event) => patch({ interests: event.target.value })}
          maxLength={LIMITS.interestsMax}
          aria-invalid={Boolean(errors.interests)}
        />
      </Field>
      <Field
        label="Visibility"
        htmlFor="passport-visibility"
        error={errors.visibility}
        hint="Unlisted Passports stay off the ranking but open by link."
      >
        <SelectInput
          id="passport-visibility"
          value={form.visibility}
          onChange={(event) => patch({ visibility: event.target.value as ProfileInput["visibility"] })}
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
        </SelectInput>
      </Field>

      <div className="rounded-2xl bg-secondary px-5 py-4">
        <p className="t-h3">{completionSummary(completion)}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {completion.map((item) => (
            <li key={item.id}>
              <Badge tone={item.done ? "success" : "neutral"}>
                {item.done ? "✓ " : ""}
                {item.label}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      {formError ? <ErrorMessage title="Could not save">{formError}</ErrorMessage> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Save Passport" : "Save changes"}
        </Button>
        {profile ? (
          <Button asChild variant="secondary">
            <Link to="/passport/$username" params={{ username: profile.username }}>
              View public passport
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
