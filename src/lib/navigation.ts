import { Activity, Compass, House, IdCard, Inbox, ScrollText, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/passport" | "/discover" | "/submissions" | "/applications" | "/network";
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar (five slots max). */
  tab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House, tab: true },
  { to: "/discover", label: "Discover", icon: Compass, tab: true },
  { to: "/passport", label: "Passport", icon: IdCard, tab: true },
  { to: "/applications", label: "Applications", icon: Inbox, tab: true },
  { to: "/submissions", label: "Submissions", icon: ScrollText, tab: true },
  { to: "/network", label: "Network", icon: Activity },
];

/** Active when on the item's page or anything below it (`/discover/abc` → Discover). */
export function isNavActive(pathname: string, to: NavItem["to"]): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
