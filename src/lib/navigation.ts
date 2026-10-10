import { Activity, BookOpen, Compass, House, IdCard, Inbox, ScrollText, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/passport" | "/discover" | "/submissions" | "/applications" | "/network" | "/ranking" | "/how-it-works";
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom tab bar (five slots max). */
  tab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House, tab: true },
  { to: "/discover", label: "Discover", icon: Compass, tab: true },
  { to: "/ranking", label: "Ranking", icon: Trophy, tab: true },
  { to: "/passport", label: "Passport", icon: IdCard, tab: true },
  { to: "/submissions", label: "Submissions", icon: ScrollText, tab: true },
  { to: "/applications", label: "Applications", icon: Inbox },
  { to: "/how-it-works", label: "How it works", icon: BookOpen },
  { to: "/network", label: "Network", icon: Activity },
];

/** Active when on the item's page or anything below it (`/discover/abc` → Discover). */
export function isNavActive(pathname: string, to: NavItem["to"]): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
