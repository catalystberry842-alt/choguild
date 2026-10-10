import { createServerFn } from "@tanstack/react-start";
import type { ReviewAction } from "@/lib/work/copy";
import type { WorkInput } from "@/lib/work/validate";

export const getWorkHome = createServerFn({ method: "GET" }).handler(async () => {
  const { loadWorkHome } = await import("./state.server");
  return loadWorkHome();
});

export const getWorkItem = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const { loadWork } = await import("./state.server");
    return loadWork(data);
  });

export const createWorkItem = createServerFn({ method: "POST" })
  .validator((input: { applicationId: string; work: WorkInput }) => input)
  .handler(async ({ data }) => {
    const { startWork } = await import("./state.server");
    return startWork(data);
  });

export const reviseWorkItem = createServerFn({ method: "POST" })
  .validator((input: { id: string; work: WorkInput }) => input)
  .handler(async ({ data }) => {
    const { reviseWork } = await import("./state.server");
    return reviseWork(data);
  });

export const reviewWorkItem = createServerFn({ method: "POST" })
  .validator((input: { id: string; action: ReviewAction; comment: string; privateNote: string }) => input)
  .handler(async ({ data }) => {
    const { decideWork } = await import("./state.server");
    return decideWork(data);
  });

export const getPublicContributions = createServerFn({ method: "GET" })
  .validator((username: string) => username)
  .handler(async ({ data }) => {
    const { loadPublicWork } = await import("./state.server");
    return loadPublicWork(data);
  });
