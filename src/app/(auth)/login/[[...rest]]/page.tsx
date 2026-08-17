import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = {
  title: { absolute: "Sign in · getALPHA" },
  alternates: { canonical: "/login" },
};

/**
 * The optional catch-all segment is required by Clerk: it renders its own
 * sub-routes (verification, factor two, reset) underneath this path.
 */
export default function LoginPage() {
  return (
    <SignIn
      signUpUrl="/register"
      fallbackRedirectUrl="/dashboard"
      appearance={clerkAppearance}
    />
  );
}
