import { Compass, House, IdCard, Inbox, ScrollText, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/passport" | "/discover" | "/submissions" | "/applications";
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/passport", label: "Passport", icon: IdCard },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/applications", label: "Applications", icon: Inbox },
  { to: "/submissions", label: "Submissions", icon: ScrollText },
];
