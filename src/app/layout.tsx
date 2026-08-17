import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import GrainOverlay from "@/components/GrainOverlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The display face, used for headings on the public page and nowhere else.
 *
 * A geometric grotesk rather than the body's humanist Geist Sans: headings on
 * a page arguing for rigor over vibes need a sharper, more technical voice
 * than the same face the paragraphs are set in, without going as far as a
 * monospace (that job belongs to Geist Mono, reserved for numbers and data).
 *
 * Loaded through `next/font`, which self-hosts it at build time — a font fetched
 * from a CDN at runtime is a request that can fail and leave the page in a
 * silent fallback nobody chose.
 */
const displayGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

/**
 * Absolute base for every generated URL.
 *
 * Open Graph and Twitter cards are fetched by a crawler that has no idea what
 * origin the page came from, so a relative image URL simply produces no
 * preview. Falls back to the production origin rather than to localhost, which
 * would publish links to a machine nobody else can reach.
 */
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // The brand line stays first — a suffix appended, not a replacement,
    // so the keyword search engines want sits behind the voice a reader sees.
    default: "getALPHA — a trading desk that judges your process — Free Trading Journal",
    // Page titles read "Journal · getALPHA" without each page repeating it.
    template: "%s · getALPHA",
  },
  description:
    "Journal your trades, see the levels and the calendar that matter, and get a written review of how you traded — not a signal telling you what to buy.",
  applicationName: "getALPHA",
  openGraph: {
    type: "website",
    siteName: "getALPHA",
    url: siteUrl,
    title: "getALPHA — a trading desk that judges your process, not your luck",
    description:
      "A trading journal that computes your P&L and risk, a pre-session brief, and a written review of how you took the trade.",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "getALPHA — a trading desk that judges your process",
    description:
      "A trading journal that computes your P&L and risk, a pre-session brief, and a written review of how you took the trade.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "fGQ3dBJ9qzD4_GCx0OkaJQceTjnwbsZfhsZzGmmHDbU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${displayGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <GrainOverlay />
        <Analytics />
      </body>
    </html>
  );
}
