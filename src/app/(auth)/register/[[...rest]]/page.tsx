import RegisterConsent from "@/components/RegisterConsent";

export const metadata = {
  title: { absolute: "Create account · getALPHA" },
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return <RegisterConsent />;
}
