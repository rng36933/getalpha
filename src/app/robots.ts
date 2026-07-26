import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org"
).replace(/\/$/, "");

/**
 * Not a security control — anyone can ignore it, and the middleware is what
 * actually protects those paths. This exists so well-behaved crawlers do not
 * spend their budget on URLs that only ever redirect to a sign-in page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/dashboard/", "/api/", "/monitoring"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
