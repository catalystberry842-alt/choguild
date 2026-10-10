import { Activity, BookOpen, Compass, House, IdCard, Inbox, ScrollText, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/passport" | "/discover" | "/submissions" | "/applications" | "/network" | "/ranking" | "/how-it-works";
  label: string;
  icon: LucideIcon;
  /** Shown as a tab in the floating dock; everything else lives in its More panel. */
  dock?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House, dock: true },
  { to: "/discover", label: "Discover", icon: Compass, dock: true },
  { to: "/ranking", label: "Ranking", icon: Trophy, dock: true },
  { to: "/passport", label: "Passport", icon: IdCard, dock: true },
  { to: "/submissions", label: "Submissions", icon: ScrollText },
  { to: "/applications", label: "Applications", icon: Inbox },
  { to: "/how-it-works", label: "How it works", icon: BookOpen },
  { to: "/network", label: "Network", icon: Activity },
];

/** Active when on the item's page or anything below it (`/discover/abc` → Discover). */
export function isNavActive(pathname: string, to: NavItem["to"]): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
