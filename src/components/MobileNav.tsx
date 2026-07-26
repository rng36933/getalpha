"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  PRIMARY_ITEMS,
  SECONDARY_ITEMS,
  isActive,
  type NavItem,
} from "@/components/nav-items";

/**
 * Navigation for a phone: a slim bar at the top for identity, and a thumb-reach
 * bar at the bottom for the four pages somebody opens while trading.
 *
 * The rest live behind "More", because eight destinations do not fit across a
 * six-inch screen and cramming them in gives every one of them a target too
 * small to hit.
 *
 * Both bars are `sm:hidden`; above that the sidebar is back and this renders
 * nothing.
 */

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[1.35rem] shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

function Tab({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium tracking-tight transition-colors ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      <Icon path={item.icon} />
      <span className="w-full truncate text-center">{item.label}</span>
    </Link>
  );
}

export default function MobileNav() {
  const pathname = usePathname();

  /**
   * The sheet remembers which page it was opened on, rather than holding a
   * boolean somebody has to remember to reset.
   *
   * A sheet that survived navigation would sit open over the page just asked
   * for, and syncing a boolean back to false in an effect schedules a second
   * render to learn something the renderer already knows. Derived this way it
   * closes itself on every route change, including the back button.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const more = openedOn === pathname;

  const close = () => setOpenedOn(null);

  const moreIsActive = SECONDARY_ITEMS.some((item) =>
    isActive(pathname, item.href),
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-background/85 px-4 backdrop-blur-md sm:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-sm font-bold text-background">
            α
          </span>
          <span className="text-sm font-semibold tracking-tight">
            get<span className="text-accent">ALPHA</span>
          </span>
        </Link>

        <UserButton
          appearance={{
            elements: { userButtonAvatarBox: "width: 1.85rem; height: 1.85rem" },
          }}
        />
      </header>

      {more ? (
        <>
          {/* Tapping anywhere off the sheet closes it. A button rather than a
              div so it is reachable from the keyboard and announced. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm sm:hidden"
          />

          <div
            role="dialog"
            aria-label="More pages"
            className="fixed inset-x-0 bottom-[4.25rem] z-40 mx-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:hidden"
          >
            {SECONDARY_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 border-b border-line px-4 py-3.5 text-sm last:border-b-0 ${
                    active ? "bg-accent-soft text-accent" : "text-foreground"
                  }`}
                >
                  <Icon path={item.icon} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </>
      ) : null}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-0.5 border-t border-line bg-surface/95 px-1.5 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md sm:hidden"
      >
        {PRIMARY_ITEMS.map((item) => (
          <Tab
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onClick={close}
          />
        ))}

        <button
          type="button"
          onClick={() => setOpenedOn(more ? null : pathname)}
          aria-expanded={more}
          className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium tracking-tight transition-colors ${
            more || moreIsActive ? "text-accent" : "text-muted"
          }`}
        >
          <Icon path="M5 12h.01M12 12h.01M19 12h.01" />
          <span className="w-full truncate text-center">More</span>
        </button>
      </nav>
    </>
  );
}
