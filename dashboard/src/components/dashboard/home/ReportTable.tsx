import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export async function ReportTable() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      status: true,
    },
  });

  return (
    <div className="flex flex-col gap-4 mt-4">
      <h3 className="text-xl font-semibold">Lijst van Rapportages</h3>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Aangemaakt op</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                    #{report.id}
                </TableCell>

                <TableCell>
                  <Link
                      href={`/reports/${report.id}`}
                      className="hover:underline"
                  >
                    {report.title || `Rapportage #${report.id}`}
                  </Link>
                </TableCell>

                <TableCell>
                  {report.createdAt.toLocaleDateString()}
                </TableCell>

                <TableCell>{report.status}</TableCell>
              </TableRow>
            ))}

            {reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Geen rapportages gevonden
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
