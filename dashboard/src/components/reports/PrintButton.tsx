"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function PrintButton() {
  const pathname = usePathname();

  // Check for report pages
  const isReportPage =
    /^\/reports\/[\w-]+$/.test(pathname) ||
    pathname === "/ExampleReport";

  if (!isReportPage) return null;

  return (
    <Button
      variant="default"
      className="print:hidden"
      onClick={() => window.print()}
    >
      Print of download rapportage
    </Button>
  );
}
