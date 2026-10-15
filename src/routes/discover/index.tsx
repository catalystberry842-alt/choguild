import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { OpportunityCardView } from "@/components/board/opportunity-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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

  const activeFilters =
    search.skills.length +
    (search.category !== "all" ? 1 : 0) +
    (search.compensation !== "all" ? 1 : 0) +
    (search.status !== "open" ? 1 : 0) +
    (search.sort !== "newest" ? 1 : 0);
  const [showFilters, setShowFilters] = useState(activeFilters > 0);

  function update(next: Partial<BoardSearch>) {
    void navigate({ to: "/discover", search: { ...search, page: 1, ...next } });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title="Open work, on the record."
        description="Open work from contributors with a Chog Passport."
        actions={
          <>
            <Button asChild size="compact">
              <Link to="/opportunities/new">Publish work</Link>
            </Button>
            <Button asChild variant="secondary" size="compact">
              <Link to="/opportunities">Your listings</Link>
            </Button>
          </>
        }
      />

      <form
        className="mx-auto grid max-w-3xl gap-4"
        role="search"
        aria-label="Filter opportunities"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="board-search" className="sr-only">
            Search titles, projects, skills, and descriptions
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <TextInput
              id="board-search"
              value={search.q}
              onChange={(event) => update({ q: event.target.value })}
              placeholder="Search the board"
              className="h-12 rounded-full bg-elevated pl-11 text-[15px]"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            aria-expanded={showFilters}
            aria-controls="board-filters"
            onClick={() => setShowFilters((open) => !open)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-signal text-[11px] text-on-accent">
                {activeFilters}
              </span>
            ) : null}
          </Button>
        </div>
        {showFilters ? (
          <div id="board-filters" className="rise surface grid gap-5 p-5 sm:p-6">
            <fieldset>
              <legend className="text-[13px] font-medium text-ink">Required skills</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {BOARD_SKILLS.map((skill) => {
                  const on = search.skills.some(
                    (item: string) => item.toLowerCase() === skill.toLowerCase(),
                  );
                  return (
                    <button
                      key={skill}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        update({
                          skills: on
                            ? search.skills.filter(
                                (item: string) => item.toLowerCase() !== skill.toLowerCase(),
                              )
                            : [...search.skills, skill],
                        })
                      }
                      className={cn(
                        "min-h-9 rounded-full border px-3.5 text-[13px] transition-colors",
                        on
                          ? "border-signal bg-signal text-on-accent"
                          : "border-line-strong text-body hover:border-ink/40 hover:text-ink",
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
                <SelectInput
                  id="board-category"
                  value={search.category}
                  onChange={(event) =>
                    update({ category: event.target.value as BoardSearch["category"] })
                  }
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {CATEGORY_LABEL[item]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Compensation" htmlFor="board-comp">
                <SelectInput
                  id="board-comp"
                  value={search.compensation}
                  onChange={(event) =>
                    update({ compensation: event.target.value as BoardSearch["compensation"] })
                  }
                >
                  <option value="all">All compensation</option>
                  {COMPENSATION_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {COMPENSATION_LABEL[item]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Status" htmlFor="board-status">
                <SelectInput
                  id="board-status"
                  value={search.status}
                  onChange={(event) =>
                    update({ status: event.target.value as BoardSearch["status"] })
                  }
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="filled">Filled</option>
                  <option value="all">All public</option>
                </SelectInput>
              </Field>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Sort" htmlFor="board-sort">
                <SelectInput
                  id="board-sort"
                  value={search.sort}
                  onChange={(event) => update({ sort: event.target.value as BoardSearch["sort"] })}
                >
                  <option value="newest">Newest</option>
                  <option value="closing">Closing soon</option>
                  <option value="title">Title</option>
                </SelectInput>
              </Field>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void navigate({ to: "/discover", search: emptyBoardSearch() })}
              >
                Reset filters
              </Button>
            </div>
          </div>
        ) : null}
      </form>

      <p className="t-meta mt-12 mb-4 text-center" aria-live="polite">
        {result.total} {result.total === 1 ? "opportunity" : "opportunities"}
      </p>

      {result.items.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {result.items.map((item, index) => (
            <OpportunityCardView key={item.id} item={item} index={(result.page - 1) * result.pageSize + index} />
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          {activeFilters > 0 || search.q ? (
            <EmptyState
              title="Nothing matches these filters"
              action={
                <Button variant="secondary" size="compact" onClick={() => void navigate({ to: "/discover", search: emptyBoardSearch() })}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No open work yet"
              body="The board only shows real listings from passport holders. Publish the first one."
              action={
                <Button asChild variant="secondary" size="compact">
                  <Link to="/opportunities/new">Publish work</Link>
                </Button>
              }
            />
          )}
        </div>
      )}

      {pages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            disabled={result.page <= 1}
            onClick={() => update({ page: result.page - 1 })}
          >
            Previous
          </Button>
          <p className="t-meta tabular-nums">
            {result.page} / {pages}
          </p>
          <Button
            variant="secondary"
            disabled={result.page >= pages}
            onClick={() => update({ page: result.page + 1 })}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
