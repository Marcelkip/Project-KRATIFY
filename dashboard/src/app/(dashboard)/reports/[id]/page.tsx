"use server";

import TicketsOverPeriod from "@/components/reports/charts/TicketsOverPeriod";
import TicketsPerCategory from "@/components/reports/charts/TicketsPerCategory";
import TicketsByEntryType from "@/components/reports/charts/TicketsByEntryType";
import TicketsByLocation from "@/components/reports/charts/TicketsByLocation";
import TrendsHeader from "@/components/reports/TrendsHeader";
import IndexPage from "@/components/reports/IndexPage";
import { ReportNotFound } from "@/components/reports/ReportNotFound";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { DateRange } from "@/types/DateRange";
import ReportReviewRequired from "@/components/reports/ReviewReport";

type Props = { params: { id: string } };

export default async function ReportPage({ params }: Props) {
  // Dit moest zo omdat prisma soms inconsistent errors gaf.
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const reportId = Number.parseInt(id, 10);

  if (!id || Number.isNaN(reportId)) {
    return <ReportNotFound />;
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { tickets: true },
  });

  if (!report) {
    return (
      <>
        <ReportNotFound />
      </>
    );
  }

  const { dates, tickets, createdAt } = report;
  const startDate = new Date((dates as DateRange).startDate);
  const endDate = new Date((dates as DateRange).endDate);

  // Map tickets to include processingStatus derived from status field
  const ticketsWithProcessingStatus = tickets.map((ticket) => ({
    ...ticket,
    processingStatus: ticket.status, // Map status to processingStatus
  }));

  return (
    <>
      <div className="print:block space-y-4">
        {report.status == "pending" && (
          <Card className="border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-800">
            <CardHeader>
              <CardTitle>LET OP!</CardTitle>
            </CardHeader>
            <CardContent>
              Deze rapportage is nog in behandeling. Vernieuw de pagina later om
              de voortgang te zien.
            </CardContent>
          </Card>
        )}

        {report.status == "review_required" && (
          <ReportReviewRequired reportId={report.id} />
        )}

        {report.status == "failed" && (
          <Card className="border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-800">
            <CardHeader>
              <CardTitle>LET OP!</CardTitle>
            </CardHeader>
            <CardContent>
              Deze rapportage is gefaald tijdens het genereren. Probeer met de
              informatie hieronder opnieuw een rapportage aan te maken.
            </CardContent>
          </Card>
        )}

        {/* Rapportage Inhoud pagina */}
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4 mb-4">
          <Card className="">
            <CardHeader>
              <CardTitle className="text-lg">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <b>Rapportage details:</b>
              <ul>
                <li>
                  Rapportage intern id: <i>#{report.id}</i>
                </li>
                <li>
                  Tickets verwerkt in deze rapportage: <i>{tickets.length}</i>
                </li>
                <li>
                  Periode:{" "}
                  <i>
                    &nbsp;
                    <div className="inline-flex flex-row gap-2">
                      <p>{startDate.toLocaleDateString("nl")}</p> -
                      <p>{endDate.toLocaleDateString("nl")} </p>
                    </div>
                  </i>
                </li>
                <li>
                  Aangemaakt op: <i>{createdAt.toLocaleDateString("nl")}</i>
                </li>
              </ul>
            </CardContent>
          </Card>
          <IndexPage />
        </div>

        {/* Make sure tickets per day is at the top */}
        <section
          className="report-section print:break-inside-avoid"
          id="tickets-over-period"
          data-label="Tickets over periode"
        >
          <TicketsOverPeriod
            tickets={ticketsWithProcessingStatus}
            reportId={report.id}
            reviewRequired={report.status == "review_required"}
          />
        </section>

        <section
          className="report-section print:break-inside-avoid"
          id="tickets-per-category"
          data-label="Tickets per categorie"
        >
          <TicketsPerCategory
            tickets={tickets}
            reportId={report.id}
            reviewRequired={report.status == "review_required"}
          />
        </section>

        <section
          className="report-section print:break-inside-avoid"
          id="tickets-by-entry-type"
          data-label="Tickets per binnenkomst type"
        >
          <TicketsByEntryType
            tickets={tickets}
            reportId={report.id}
            reviewRequired={report.status == "review_required"}
          />
        </section>

        <section
          className="report-section print:break-inside-avoid"
          id="tickets-by-location"
          data-label="Tickets per locatie"
        >
          <TicketsByLocation
            tickets={tickets}
            reportId={report.id}
            reviewRequired={report.status == "review_required"}
          />
        </section>

        <section
          className="report-section print:break-inside-avoid"
          id="trends"
          data-label="Trends en opvallende waardes"
        >
          <TrendsHeader reportId={report.id} />
        </section>
      </div>
    </>
  );
}
