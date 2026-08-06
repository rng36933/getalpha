import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog";
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
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
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
    {
      url: `${siteUrl}/changelog`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
