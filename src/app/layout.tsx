import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "getALPHA",
  description: "Signals, macro, journal and calendar in one trading desk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // TODO: Clerk's sign-in card renders in its own default theme, which may
    // look light against this dark app. Tune `appearance` once the screens are
    // visible — the variable names changed in Clerk v7 and guessing them
    // without being able to see the result is not worth a broken build.
    <ClerkProvider>
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
