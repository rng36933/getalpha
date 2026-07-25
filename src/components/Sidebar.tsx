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
    href: "/",
    label: "Dashboard",
    icon: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  },
  {
    href: "/macro-desk",
    label: "Macro Desk",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18",
  },
  {
    href: "/journal",
    label: "Journal",
    icon: "M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 0v18M9 8h6M9 12h6",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: "M8 2v4M16 2v4M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 21H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 5Z",
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
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
