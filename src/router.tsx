import { createRouter } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/ui/loading-state";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    title?: string;
    crumb?: string;
  }
}

export function getRouter() {
  return createRouter({
    routeTree,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 400,
    scrollRestoration: true,
  });
}
