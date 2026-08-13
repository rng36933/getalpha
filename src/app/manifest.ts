import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the site installable (Chrome "Add to Home
 * Screen", and the basis for the Android package built via a TWA wrapper).
 * Icons point at the generated routes rather than checked-in binaries so
 * they can never drift from the wordmark's brand colours.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "getALPHA — Trading Journal",
    short_name: "getALPHA",
    description:
      "Journal your trades, see the levels and the calendar that matter, and get a written review of how you traded.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0b0f",
    theme_color: "#0a0b0f",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
