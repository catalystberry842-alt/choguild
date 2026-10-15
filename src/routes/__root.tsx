import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { NotFoundState } from "@/components/layout/not-found";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AuthProvider } from "@/lib/auth/provider";
import { PassportProvider } from "@/components/passport/passport-provider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "Choguild";

export const Route = createRootRoute({
  head: ({ matches }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Pages set their own titles; only an unmatched URL (just the root matched) falls back here.
      { title: matches.length > 1 ? APP_NAME : `Page not found · ${APP_NAME}` },
      {
        name: "description",
        content:
          "Choguild helps Monad contributors keep an identity, find opportunities, and build a record of reviewed work.",
      },
      { name: "theme-color", content: "#050505" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <NotFoundState />,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <PassportProvider>
            <AppShell>
              <Outlet />
            </AppShell>
          </PassportProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
