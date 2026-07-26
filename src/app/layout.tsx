import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { clerkAppearance } from "@/lib/clerk-appearance";
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
    default: "getALPHA — a trading desk that judges your process",
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
      "A trading journal that computes your R-multiples, a pre-session risk brief, and a written review of how you took the trade.",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "getALPHA — a trading desk that judges your process",
    description:
      "A trading journal that computes your R-multiples, a pre-session risk brief, and a written review of how you took the trade.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="en"
        className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
