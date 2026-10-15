import { createRouter } from "@tanstack/react-router";
import { LoadingState } from "@/components/ui/loading-state";
import { AppErrorComponent } from "@/lib/error-component";
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
    defaultErrorComponent: AppErrorComponent,
    defaultPendingComponent: () => <LoadingState label="Loading page" />,
    // Navigation should feel instant: preload on hover/touch, keep loader data warm,
    // and never flash a skeleton for fast loads.
    defaultPreload: "intent",
    defaultPreloadDelay: 40,
    defaultStaleTime: 30_000,
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 800,
    defaultPendingMinMs: 300,
    scrollRestoration: true,
  });
}
