import Sidebar from "@/components/Sidebar";

/**
 * Shell for the signed-in application. The sign-in and sign-up screens live in
 * the (auth) group and deliberately do not get the sidebar.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
