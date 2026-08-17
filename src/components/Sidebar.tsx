"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/components/nav-items";
import PlanBadge from "@/components/PlanBadge";

/**
 * The desktop rail. Hidden below `sm`, where `MobileNav` takes over.
 *
 * It used to stay visible on a phone as a 64-pixel column of unlabelled icons,
 * which spent a sixth of the screen on navigation nobody could read. A rail
 * that cannot show its labels is not a narrow sidebar; it is a worse one.
 */
export default function Sidebar({
  name,
  pro,
  admin,
}: Readonly<{ name: string; pro: boolean; admin?: boolean }>) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-10 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface backdrop-blur-md sm:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-none bg-accent text-base font-bold text-background">
          α
        </span>
        <span className="truncate text-sm font-semibold tracking-tight">
          get<span className="text-accent">ALPHA</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-none border-l-2 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-l-[#f2c94c] bg-surface-raised font-medium text-accent"
                  : "border-l-transparent text-muted hover:bg-surface-raised hover:text-foreground"
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
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {admin && (
          <Link
            href="/dashboard/admin"
            aria-current={pathname === "/dashboard/admin" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname === "/dashboard/admin"
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
              <path d="M12 2L2 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5Z" />
            </svg>
            <span className="truncate">Admin</span>
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3 border-t border-line p-4">
        <UserButton
          appearance={{
            elements: { userButtonAvatarBox: "width: 2rem; height: 2rem" },
          }}
        />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-xs font-medium text-positive">{name}</span>
          <PlanBadge pro={pro} />
        </div>
      </div>
    </aside>
  );
}
