import { createRouter } from "@tanstack/react-router";
import { LoadingState } from "@/components/ui/loading-state";
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
    defaultPendingComponent: () => <LoadingState label="Loading page" />,
    defaultPendingMs: 400,
    scrollRestoration: true,
  });
}
