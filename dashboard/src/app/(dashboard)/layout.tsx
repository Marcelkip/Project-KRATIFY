import { DashboardSideBar } from "@/components/dashboard/sideBar/DashboardSideBar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ReportDialog } from "@/components/dashboard/home/ReportDialog";
import { Toaster } from "@/components/ui/sonner";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrintButton } from "@/components/reports/PrintButton";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={false}
        disableTransitionOnChange
      >
        <DashboardSideBar />
        <main className="w-full max-w-full min-h-screen p-8 flex flex-col gap-4">
          <div className="flex flex-row justify-between">
            <SidebarTrigger className="print:hidden" />
            <div>
              <PrintButton />
            </div>
            <div className="print:hidden">
              <ReportDialog />
            </div>
          </div>
          {children}
        </main>
        <Toaster />
      </ThemeProvider>
    </SidebarProvider>
  );
}
