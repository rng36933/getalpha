"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  /** SVG path data drawn with `stroke="currentColor"` on a 24x24 viewBox. */
  icon: string;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  },
  {
    href: "/dashboard/macro-desk",
    label: "Macro Desk",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18",
  },
  {
    href: "/dashboard/journal",
    label: "Journal",
    icon: "M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 0v18M9 8h6M9 12h6",
  },
  {
    href: "/dashboard/pairs",
    label: "Pairs",
    icon: "M4 18l5-6 4 4 7-9M4 20V4M4 20h16",
  },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    icon: "M8 2v4M16 2v4M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 5Z",
  },
  {
    href: "/dashboard/pricing",
    label: "Plans",
    icon: "M12 2v20M17 5.5C17 4 15.2 3 12 3S7 4 7 5.9c0 4.6 10 2.3 10 7 0 2-2 3.1-5 3.1s-5-1.2-5-3",
  },
  {
    href: "/dashboard/referral",
    label: "Referrals",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6",
  },
  {
    href: "/dashboard/support",
    label: "Support",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  },
];

function isActive(pathname: string, href: string) {
  // "/dashboard" is a prefix of every other entry, so it only matches exactly;
  // otherwise it would light up on every page in the app.
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-line bg-surface sm:w-60">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-4 sm:px-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-base font-bold text-background">
          α
        </span>
        <span className="hidden truncate text-sm font-semibold tracking-tight sm:inline">
          get<span className="text-accent">ALPHA</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 sm:p-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5 shrink-0"
              >
                <path d={item.icon} />
              </svg>
              <span className="hidden truncate sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-line p-3 sm:p-4">
        <UserButton
          appearance={{ elements: { userButtonAvatarBox: "width: 2rem; height: 2rem" } }}
        />
        <span className="hidden truncate text-xs text-muted sm:inline">
          Account
        </span>
      </div>
    </aside>
  );
}
