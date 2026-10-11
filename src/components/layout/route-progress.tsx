import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** Thin gradient bar at the top of the viewport while a route is loading. */
export function RouteProgress() {
  const loading = useRouterState({ select: (state) => state.isLoading || state.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      // Skip the bar for instant navigations so it does not flicker.
      const timer = window.setTimeout(() => setVisible(true), 120);
      return () => window.clearTimeout(timer);
    }
    setVisible(false);
  }, [loading]);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5" role="progressbar" aria-label="Loading page">
      <div className="route-progress h-full rounded-r-full" />
    </div>
  );
}
