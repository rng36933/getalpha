import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign in · getALPHA",
};

/**
 * The optional catch-all segment is required by Clerk: it renders its own
 * sub-routes (verification, factor two, reset) underneath this path.
 */
export default function LoginPage() {
  return <SignIn signUpUrl="/register" fallbackRedirectUrl="/dashboard" />;
}
