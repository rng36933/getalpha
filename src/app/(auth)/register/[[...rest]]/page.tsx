import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Create account · getALPHA",
};

export default function RegisterPage() {
  return <SignUp signInUrl="/login" fallbackRedirectUrl="/" />;
}
