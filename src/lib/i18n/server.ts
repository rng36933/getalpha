import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, suggestLocale, type Locale } from "./locales.ts";

/**
 * The locale a Server Component should render in, for the signed-in app.
 *
 * Its own file, separate from `locales.ts`: this one reads `next/headers`,
 * which only exists inside a request, so it cannot be the file the bare node
 * test runner loads for `suggestLocale`'s own unit tests.
 *
 * Mirrors exactly what `middleware.ts` decides when it sets `LOCALE_COOKIE` —
 * cookie first, then the geo header, same as there — because on a visitor's
 * very first request of all, the cookie the middleware is about to *set* is
 * not yet visible to this request's own render; only reading the same header
 * it read keeps this render and that cookie in agreement.
 *
 * No caching beyond the request: two calls in one render read the same
 * headers twice, which costs nothing, and a per-request memo would be a
 * second piece of state to keep in sync with cookies changing between
 * requests for no measurable benefit.
 */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  return suggestLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    country: headerStore.get("x-vercel-ip-country"),
  });
}
