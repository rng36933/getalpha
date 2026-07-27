import type { MetadataRoute } from "next";
import { LEGAL_VERSIONS } from "@/lib/legal/documents";

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org"
).replace(/\/$/, "");

/**
 * The sitemap, built from the routes rather than typed out.
 *
 * Only pages a signed-out crawler can actually fetch. Listing anything under
 * /dashboard would advertise URLs that answer with a redirect to sign-in,
 * which wastes crawl budget and tells search engines the site is mostly
 * inaccessible.
 *
 * The legal pages carry their document version as `lastModified`, so editing a
 * document and bumping its version is what tells a crawler to look again —
 * there is no separate date to remember to update.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  /**
   * Both languages of the landing page, each naming the other.
   *
   * A translated page that a crawler is never told about is a translated page
   * nobody finds. `alternates.languages` is the sitemap half of the same
   * statement the pages make with their hreflang tags, and Google wants to see
   * it from both directions before it will treat the pair as one page in two
   * languages rather than two pages competing for the same result.
   */
  const languages = {
    en: `${siteUrl}/`,
    lt: `${siteUrl}/lt`,
    "x-default": `${siteUrl}/`,
  };

  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${siteUrl}/lt`,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${siteUrl}/register`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/login`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: new Date(LEGAL_VERSIONS.disclaimer),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(LEGAL_VERSIONS.terms),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(LEGAL_VERSIONS.privacy),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
