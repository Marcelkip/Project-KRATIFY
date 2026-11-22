//"use client";

import { HeroSection } from "@/components/dashboard/home/HeroSection";
import { ReportTable } from "@/components/dashboard/home/ReportTable";
import { QuickActions } from "@/components/dashboard/home/quick-actions";
import { RecentReports } from "@/components/dashboard/home/RecentReports";

export default function Home() {
  return (
    <div className="h-min-screen w-full">
      <HeroSection />
      <QuickActions />
      <RecentReports />
      <ReportTable />
    </div>
  );
}
