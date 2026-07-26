import { auth } from "@clerk/nextjs/server";
import ConsentGate from "@/components/ConsentGate";
import Sidebar from "@/components/Sidebar";
import { hasAcceptedCurrentTerms } from "@/lib/legal/acceptance";
import { CURRENT_LEGAL_VERSION, LEGAL_PAGES } from "@/lib/legal/documents";

/**
 * Shell for the signed-in application. The sign-in and sign-up screens live in
 * the (auth) group and deliberately do not get the sidebar.
 *
 * The consent gate sits here rather than on each page, so a route added later
 * is covered without anyone remembering to cover it.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (userId && !(await hasAcceptedCurrentTerms(userId))) {
    return (
      <ConsentGate version={CURRENT_LEGAL_VERSION} documents={LEGAL_PAGES} />
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
