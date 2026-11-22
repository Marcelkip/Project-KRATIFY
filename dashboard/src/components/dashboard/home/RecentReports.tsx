import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";

export async function RecentReports() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
    },
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden flex flex-col md:flex-wrap lg:flex-row mt-4">
      {reports.map((report, index) => (
        <div key={report.id} className="basis-1/1 md:basis-1/2 lg:basis-1/5">
          <div
            className={`px-2 ${
              index === 0 ? "pl-0" : index === reports.length - 1 ? "pr-0" : ""
            } h-full`}
          >
            <Card className="h-full py-4">
              <CardContent className="flex flex-col items-start justify-between gap-3 min-w-0">
                <div className="w-full flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {report.createdAt.toLocaleDateString()}
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-xl font-semibold text-black dark:text-white">
                    {report.title || `Report #${report.id}`}
                  </div>
                  <div className="text-sm text-muted-foreground truncate mt-1">
                    Status: {report.status}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-start p-3 pb-0 gap-2">
                <Link href={`/reports/${report.id}`}>
                  <Button variant="outline" className="text-sm">
                    Open
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
