"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ReportReviewCard } from "../ReviewReport";
import { useEffect, useState } from "react";
import { getChartDescription } from "@/actions/get-chart-description";

type Ticket = {
  callerDepartment: string | null;
};

interface Props {
  tickets: Ticket[];
  reportId: number;
  reviewRequired?: boolean;
}

const chartConfig = {
  tickets: { label: "Aantal tickets", color: "#2563eb" },
} satisfies ChartConfig;

export default function TicketsByLocation({
  tickets,
  reportId,
  reviewRequired,
}: Props) {
  const [chartDescription, setChartDescription] =
    useState<string>("Loading...");

  // Load description
  useEffect(() => {
    async function fetch() {
      const data = await getChartDescription(reportId, "tickets-by-location");
      setChartDescription(data || "Loading...");
    }
    fetch();
  }, [reportId]);

  if (tickets.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Tickets per locatie</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Geen tickets beschikbaar voor deze periode.</p>
        </CardContent>
      </Card>
    );
  }

  // Count tickets per location
  const locationCounts: Record<string, number> = {};
  tickets.forEach((ticket) => {
    const location = ticket.callerDepartment || "Onbekend";
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });

  // Convert to chart data and sort by count (descending)
  const chartData = Object.entries(locationCounts)
    .map(([location, count]) => ({
      location,
      tickets: count,
    }))
    .sort((a, b) => b.tickets - a.tickets);

  // Get top location
  const topLocation = chartData[0];

  return (
    <Card className="w-full">
      <CardHeader>
        {reviewRequired && (
          <ReportReviewCard
            reportId={reportId}
            chartId="tickets-by-location"
            description={chartDescription}
          />
        )}
        <CardTitle className="text-lg">Tickets per locatie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-[60%_1fr] grid-cols-1 gap-4 lg:gap-8">
          <div className="w-full">
            <div className="print:break-inside-avoid">
              {/* Chart */}
              <ChartContainer
                config={chartConfig}
                className="min-h-[60vh] lg:min-h-[40vh] max-w-full"
              >
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 12, right: 12, bottom: 12, left: 60 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="location"
                    type="category"
                    tickLine={false}
                    tickMargin={8}
                    width={150}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        labelFormatter={(value) => value}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="tickets"
                    fill="var(--color-tickets)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Analyze */}
          <div className="">
            {/* <p>
              De locatie met de meeste tickets is{" "}
              <strong>{topLocation.location}</strong> met{" "}
              <strong>{topLocation.tickets}</strong> tickets. In totaal zijn er{" "}
              <strong>{chartData.length}</strong> verschillende locaties
              geregistreerd.
            </p> */}
            <p>{chartDescription}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
