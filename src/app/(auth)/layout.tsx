import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import AuthBackdrop from "@/components/AuthBackdrop";
import { clerkAppearance } from "@/lib/clerk-appearance";

/**
 * Centred shell for the sign-in and sign-up screens. No sidebar.
 *
 * `relative` so the backdrop's fixed layer sits behind this content rather than
 * over it, and so the wordmark and card keep their own stacking context.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-12">
        <AuthBackdrop />

        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-lg font-bold text-background">
            α
          </span>
          <span className="text-lg font-semibold tracking-tight">
            get<span className="text-accent">ALPHA</span>
          </span>
        </Link>

        {children}
      </div>
    </ClerkProvider>
  );
}
