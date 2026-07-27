"use client";

import { useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  pathForLocale,
  type Locale,
} from "@/lib/i18n/locales";

/**
 * The control that lets a reader overrule whatever their IP suggested.
 *
 * This is not a convenience. Deciding a language by country alone and leaving
 * no way out strands a Lithuanian on holiday, anybody behind a VPN, and every
 * English speaker living in Lithuania — and the ones it strands are exactly the
 * ones who cannot read the page well enough to find the fix.
 *
 * The cookie is written before navigating, and from then on it wins over the
 * country in `suggestLocale`. One click is a decision, and it is remembered.
 */
export default function LocaleSwitch({
  current,
  other,
  label,
  pathname,
}: {
  current: Locale;
  other: Locale;
  /** The other language, written in that language. */
  label: string;
  pathname: string;
}) {
  const router = useRouter();
  const href = pathForLocale(pathname, other);

  function choose(event: React.MouseEvent<HTMLAnchorElement>) {
    // Let a middle-click or a modified click open a tab as normal. Hijacking
    // those is the kind of small rudeness that makes a site feel wrong.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();

    // Not `httpOnly`, because this is the one cookie the browser itself must be
    // able to set. It holds a two-letter language code and nothing else.
    document.cookie =
      `${LOCALE_COOKIE}=${other}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;

    router.push(href);
    router.refresh();
  }

  return (
    <a
      href={href}
      onClick={choose}
      hrefLang={other}
      aria-label={`Switch language — ${label}`}
      className="hidden text-zinc-400 transition-all duration-300 ease-in-out hover:text-white sm:inline"
    >
      <span aria-hidden="true" className="mr-1.5 font-mono text-[10px] uppercase">
        {current}
      </span>
      {label}
    </a>
  );
}
