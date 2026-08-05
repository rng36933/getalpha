import Link from "next/link";
import VisitTracker from "@/components/landing/VisitTracker";
import { LEGAL_PAGES } from "@/lib/legal/documents";

/**
 * Layout for the legal pages.
 *
 * Outside the app shell and outside authentication: somebody has to be able to
 * read the terms before deciding whether to sign up, and a policy you can only
 * see once you have already agreed to it is not a policy.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background">
      <VisitTracker />
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            get<span className="text-accent">ALPHA</span>
          </Link>

          <nav className="flex items-center gap-4 text-xs text-muted">
            <Link href="/changelog" className="font-medium text-accent hover:text-accent/80">
              Changelog
            </Link>
            {LEGAL_PAGES.map((page) => (
              <Link key={page.href} href={page.href} className="hover:text-foreground">
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-8 text-xl font-bold leading-snug sm:text-2xl" style={{ color: "#f2c94c" }}>
          getALPHA is an educational and informational tool. It does not provide
          financial advice.
        </div>
      </footer>
    </div>
  );
}
