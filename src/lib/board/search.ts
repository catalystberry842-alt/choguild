import {
  CATEGORIES,
  COMPENSATION_TYPES,
  type Category,
  type CompensationType,
} from "@/lib/board/copy";

export type BoardSort = "newest" | "closing" | "title";
export type BoardStatusFilter = "open" | "closed" | "filled" | "all";

export type BoardSearch = {
  q: string;
  category: Category | "all";
  skills: string[];
  compensation: CompensationType | "all";
  status: BoardStatusFilter;
  sort: BoardSort;
  page: number;
};

export const PAGE_SIZE = 6;

export function emptyBoardSearch(): BoardSearch {
  return { q: "", category: "all", skills: [], compensation: "all", status: "open", sort: "newest", page: 1 };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseBoardSearch(search: Record<string, unknown>): BoardSearch {
  const categoryRaw = text(search.category, 20);
  const compensationRaw = text(search.compensation, 20);
  const statusRaw = text(search.status, 20);
  const sortRaw = text(search.sort, 20);
  const pageRaw = Number(search.page);
  const skills = text(search.skills, 160)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
  return {
    q: text(search.q, 80),
    category: CATEGORIES.find((item) => item === categoryRaw) ?? "all",
    skills,
    compensation: COMPENSATION_TYPES.find((item) => item === compensationRaw) ?? "all",
    status: statusRaw === "closed" || statusRaw === "filled" || statusRaw === "all" ? statusRaw : "open",
    sort: sortRaw === "closing" || sortRaw === "title" ? sortRaw : "newest",
    page: Number.isInteger(pageRaw) && pageRaw > 0 && pageRaw < 1000 ? pageRaw : 1,
  };
}
