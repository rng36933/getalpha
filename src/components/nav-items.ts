import { navCopy } from "@/lib/i18n/nav";
import type { Locale } from "@/lib/i18n/locales";

export type NavItem = {
  href: string;
  label: string;
  /** SVG path data drawn with `stroke="currentColor"` on a 24x24 viewBox. */
  icon: string;
};

/** The shape shared by every destination, before its label is translated. */
type NavEntry = {
  href: string;
  key: keyof ReturnType<typeof navCopy>["items"];
  icon: string;
};

/**
 * Every destination in the signed-in app, in the order the sidebar lists them.
 *
 * Shared by the desktop sidebar and the phone's bottom bar so a page added here
 * appears in both. Two copies of this list is how a route ends up reachable on
 * one screen size and invisible on the other.
 *
 * A plain `label` string used to live here. It is looked up from `key` through
 * `navItems(locale)` below instead, because this array is a module-level
 * constant built once at import time — a string baked in then cannot change
 * per reader the way a function's return value can.
 */
const NAV_ENTRIES: NavEntry[] = [
  {
    href: "/dashboard",
    key: "dashboard",
    icon: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  },
  {
    href: "/dashboard/macro-desk",
    key: "macroDesk",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18",
  },
  {
    href: "/dashboard/journal",
    key: "journal",
    icon: "M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 0v18M9 8h6M9 12h6",
  },
  {
    href: "/dashboard/pairs",
    key: "pairs",
    icon: "M4 18l5-6 4 4 7-9M4 20V4M4 20h16",
  },
  {
    href: "/dashboard/calendar",
    key: "calendar",
    icon: "M8 2v4M16 2v4M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 5Z",
  },
  {
    href: "/dashboard/pricing",
    key: "plans",
    icon: "M12 2v20M17 5.5C17 4 15.2 3 12 3S7 4 7 5.9c0 4.6 10 2.3 10 7 0 2-2 3.1-5 3.1s-5-1.2-5-3",
  },
  {
    href: "/dashboard/referral",
    key: "referrals",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6",
  },
  {
    href: "/dashboard/support",
    key: "support",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  },
  {
    href: "/dashboard/settings",
    key: "settings",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  },
];

/** Every destination, labelled in the given language. */
export function navItems(locale: Locale): NavItem[] {
  const labels = navCopy(locale).items;
  return NAV_ENTRIES.map((entry) => ({
    href: entry.href,
    icon: entry.icon,
    label: labels[entry.key],
  }));
}

/**
 * The four the phone's bottom bar carries, and it is four rather than five
 * because a fifth slot is taken by the button that opens the rest.
 *
 * Chosen as the ones somebody opens while trading: what is open and what it
 * risks, what the session has done, the record, and what is due today. Plans,
 * referrals and settings are things you visit once.
 */
export const PRIMARY_HREFS = [
  "/dashboard",
  "/dashboard/pairs",
  "/dashboard/journal",
  "/dashboard/calendar",
] as const;

export function primaryNavItems(locale: Locale): NavItem[] {
  const items = navItems(locale);
  return PRIMARY_HREFS.map((href) => items.find((item) => item.href === href)!);
}

export function secondaryNavItems(locale: Locale): NavItem[] {
  return navItems(locale).filter(
    (item) => !PRIMARY_HREFS.includes(item.href as (typeof PRIMARY_HREFS)[number]),
  );
}

/**
 * "/dashboard" is a prefix of every other entry, so it only matches exactly;
 * otherwise it would light up on every page in the app.
 */
export function isActive(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}
