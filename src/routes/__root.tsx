import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { NotFoundState } from "@/components/layout/not-found";
import { PassportProvider } from "@/components/passport/passport-provider";
import geist400 from "@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2?url";
import geist600 from "@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2?url";
import { useEffect } from "react";
import { installErrorReporting } from "@/lib/report-error";
import appCss from "../styles.css?url";

const APP_NAME = "Choguild";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Choguild helps Monad contributors keep an identity, find opportunities, and build a record of reviewed work.",
      },
      { name: "theme-color", content: "#0e0b1f" },
      { property: "og:title", content: "Choguild" },
      { property: "og:description", content: "The contributor guild on Monad: a passport, open work, and a record of reviewed contributions." },
      { property: "og:image", content: "https://choguild.vercel.app/og.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preload", href: geist400, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: geist600, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundState,
});

function RootComponent() {
  useEffect(() => installErrorReporting(), []);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
          <PassportProvider>
            <AppShell>
              <Outlet />
            </AppShell>
          </PassportProvider>
        <Scripts />
      </body>
    </html>
  );
}
