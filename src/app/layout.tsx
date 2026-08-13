import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
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
 * The display face, used on the public page and nowhere else.
 *
 * The landing page argues a case and the application reports measurements, and
 * those are different jobs for type: a masthead serif gives the argument a voice
 * no competitor dashboard has, while inside the app the same face would fight
 * the instrument-panel reading the numbers depend on.
 *
 * Loaded through `next/font`, which self-hosts it at build time — a font fetched
 * from a CDN at runtime is a request that can fail and leave the page in a
 * silent fallback nobody chose.
 */
const displaySerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
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
      className={`dark ${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
