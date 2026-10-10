import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { OpportunityCardView } from "@/components/board/opportunity-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectInput, TextInput } from "@/components/ui/input";
import {
  BOARD_SKILLS,
  CATEGORIES,
  CATEGORY_LABEL,
  COMPENSATION_LABEL,
  COMPENSATION_TYPES,
} from "@/lib/board/copy";
import { listBoard } from "@/lib/board/functions";
import { emptyBoardSearch, parseBoardSearch, type BoardSearch } from "@/lib/board/search";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/discover/")({
  validateSearch: (search: Record<string, unknown>) => parseBoardSearch(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listBoard({ data: deps }),
  staticData: { title: "Discover", crumb: "Discover" },
  head: () => ({ meta: [{ title: "Discover · Choguild" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const search = Route.useSearch();
  const result = Route.useLoaderData();
  const navigate = useNavigate();
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function update(next: Partial<BoardSearch>) {
    void navigate({ to: "/discover", search: { ...search, page: 1, ...next } });
  }

  return (
    <div>
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Collaboration board</p>
          <h1 className="mt-3 text-[1.75rem] leading-tight text-ink">Opportunities</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
            Open work from people with a Chog Passport. Demo listings are marked and do not accept applications.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="compact">
            <Link to="/opportunities">Your opportunities</Link>
          </Button>
          <Button asChild size="compact">
            <Link to="/opportunities/new">Publish an opportunity</Link>
          </Button>
        </div>
      </header>

      <form
        className="mt-6 grid gap-4 rounded-lg border border-line bg-elevated p-4"
        role="search"
        aria-label="Filter opportunities"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field label="Search" htmlFor="board-search" hint="Titles, projects, skills, and descriptions.">
          <TextInput
            id="board-search"
            value={search.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Search the board"
          />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-ink">Required skills</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {BOARD_SKILLS.map((skill) => {
              const on = search.skills.some((item: string) => item.toLowerCase() === skill.toLowerCase());
              return (
                <button
                  key={skill}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    update({
                      skills: on
                        ? search.skills.filter((item: string) => item.toLowerCase() !== skill.toLowerCase())
                        : [...search.skills, skill],
                    })
                  }
                  className={cn(
                    "min-h-11 rounded-lg border px-3 text-sm",
                    on ? "border-action bg-elevated text-ink" : "border-line text-body",
                  )}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" htmlFor="board-category">
            <SelectInput id="board-category" value={search.category} onChange={(event) => update({ category: event.target.value as BoardSearch["category"] })}>
              <option value="all">All categories</option>
              {CATEGORIES.map((item) => <option key={item} value={item}>{CATEGORY_LABEL[item]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Compensation" htmlFor="board-comp">
            <SelectInput id="board-comp" value={search.compensation} onChange={(event) => update({ compensation: event.target.value as BoardSearch["compensation"] })}>
              <option value="all">All compensation</option>
              {COMPENSATION_TYPES.map((item) => <option key={item} value={item}>{COMPENSATION_LABEL[item]}</option>)}
            </SelectInput>
          </Field>
          <Field label="Status" htmlFor="board-status">
            <SelectInput id="board-status" value={search.status} onChange={(event) => update({ status: event.target.value as BoardSearch["status"] })}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="filled">Filled</option>
              <option value="all">All public</option>
            </SelectInput>
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Sort" htmlFor="board-sort">
            <SelectInput id="board-sort" value={search.sort} onChange={(event) => update({ sort: event.target.value as BoardSearch["sort"] })}>
              <option value="newest">Newest</option>
              <option value="closing">Closing soon</option>
              <option value="title">Title</option>
            </SelectInput>
          </Field>
          <Button type="button" variant="ghost" onClick={() => void navigate({ to: "/discover", search: emptyBoardSearch() })}>
            Reset filters
          </Button>
        </div>
      </form>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {result.total} {result.total === 1 ? "opportunity" : "opportunities"}
      </p>

      {result.items.length > 0 ? (
        <ul className="mt-3 grid gap-4 md:grid-cols-2">
          {result.items.map((item) => <OpportunityCardView key={item.id} item={item} />)}
        </ul>
      ) : (
        <div className="mt-3">
          <EmptyState
            title="No opportunities match"
            body="Nothing on the board fits these filters. Reset them, or publish an opportunity from your passport."
            action={<Button onClick={() => void navigate({ to: "/discover", search: emptyBoardSearch() })}>Reset filters</Button>}
          />
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-4 flex items-center gap-2">
          <Button variant="secondary" disabled={result.page <= 1} onClick={() => update({ page: result.page - 1 })}>Previous</Button>
          <p className="text-sm text-body">Page {result.page} of {pages}</p>
          <Button variant="secondary" disabled={result.page >= pages} onClick={() => update({ page: result.page + 1 })}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}
