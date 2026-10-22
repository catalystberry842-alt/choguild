import { Activity, BookOpen, FileText, Compass, House, IdCard, Inbox, ScrollText, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/passport" | "/discover" | "/submissions" | "/applications" | "/network" | "/ranking" | "/how-it-works" | "/docs";
  label: string;
  icon: LucideIcon;
  /** Shown in the desktop header; everything else lives in the menu and footer. */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/discover", label: "Discover", icon: Compass, primary: true },
  { to: "/ranking", label: "Leaderboard", icon: Trophy, primary: true },
  { to: "/passport", label: "My Chog", icon: IdCard },
  { to: "/submissions", label: "Submissions", icon: ScrollText, primary: true },
  { to: "/applications", label: "Applications", icon: Inbox, primary: true },
  { to: "/how-it-works", label: "How it works", icon: BookOpen, primary: true },
  { to: "/network", label: "Network", icon: Activity },
  { to: "/docs", label: "Docs", icon: FileText },
];

/** Active when on the item's page or anything below it (`/discover/abc` → Discover). */
export function isNavActive(pathname: string, to: NavItem["to"]): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
