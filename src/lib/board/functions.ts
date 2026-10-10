import { createServerFn } from "@tanstack/react-start";
import type { ReviewStatus } from "@/lib/board/copy";
import { parseBoardSearch } from "@/lib/board/search";
import type { ApplicationInput, OpportunityInput } from "@/lib/board/validate";

export const listBoard = createServerFn({ method: "GET" })
  .validator((search: Record<string, unknown>) => parseBoardSearch(search))
  .handler(async ({ data }) => {
    const { loadBoard } = await import("./state.server");
    return loadBoard(data);
  });

export const getBoardOpportunity = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { loadOpportunity } = await import("./state.server");
    return loadOpportunity(data);
  });

export const listMyOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const { loadOwned } = await import("./state.server");
  return loadOwned();
});

export const createBoardOpportunity = createServerFn({ method: "POST" })
  .validator((input: OpportunityInput) => input)
  .handler(async ({ data }) => {
    const { publishOpportunity } = await import("./state.server");
    return publishOpportunity(data);
  });

export const saveBoardOpportunity = createServerFn({ method: "POST" })
  .validator((input: { id: string; opportunity: OpportunityInput }) => input)
  .handler(async ({ data }) => {
    const { editOpportunity } = await import("./state.server");
    return editOpportunity(data);
  });

export const updateBoardStatus = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: "open" | "closed" | "filled" }) => input)
  .handler(async ({ data }) => {
    const { changeOpportunityStatus } = await import("./state.server");
    return changeOpportunityStatus(data);
  });

export const sendApplication = createServerFn({ method: "POST" })
  .validator((input: { opportunityId: string; application: ApplicationInput }) => input)
  .handler(async ({ data }) => {
    const { submitApplication } = await import("./state.server");
    return submitApplication(data);
  });

export const withdrawBoardApplication = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { pullApplication } = await import("./state.server");
    return pullApplication(data);
  });

export const decideApplication = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: ReviewStatus; feedback: string }) => input)
  .handler(async ({ data }) => {
    const { reviewApplication } = await import("./state.server");
    return reviewApplication(data);
  });

export const listBoardApplications = createServerFn({ method: "GET" }).handler(async () => {
  const { loadMyApplications } = await import("./state.server");
  return loadMyApplications();
});

export const getBoardApplication = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { loadApplication } = await import("./state.server");
    return loadApplication(data);
  });

export const listBoardReviews = createServerFn({ method: "GET" })
  .validator((opportunityId: string) => opportunityId)
  .handler(async ({ data }) => {
    const { loadReviews } = await import("./state.server");
    return loadReviews(data);
  });
