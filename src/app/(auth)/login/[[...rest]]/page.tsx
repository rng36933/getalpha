import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: { absolute: "Sign in · getALPHA" },
  alternates: { canonical: "/login" },
};

/**
 * The optional catch-all segment is required by Clerk: it renders its own
 * sub-routes (verification, factor two, reset) underneath this path.
 *
 * No `appearance` prop here — `ClerkProvider` in the auth layout already
 * applies the site's theme (src/lib/clerk-appearance.ts) to every Clerk
 * component it wraps.
 */
export default function LoginPage() {
  return <SignIn signUpUrl="/register" fallbackRedirectUrl="/dashboard" />;
}
