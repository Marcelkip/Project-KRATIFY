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
  category: string | null;
};

interface Props {
  tickets: Ticket[];
  reportId: number;
  reviewRequired?: boolean;
}

const chartConfig = {
  tickets: {
    label: "Aantal tickets",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export default function TicketsPerCategory({
  tickets,
  reportId,
  reviewRequired,
}: Props) {
  const [chartDescription, setChartDescription] =
    useState<string>("Loading...");

  // Load description
  useEffect(() => {
    async function fetch() {
      const data = await getChartDescription(reportId, "tickets-per-category");
      setChartDescription(data || "Loading...");
    }
    fetch();
  }, [reportId]);

  if (tickets.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Tickets per categorie</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Geen tickets beschikbaar voor deze periode.</p>
        </CardContent>
      </Card>
    );
  }

  // Count tickets per category
  const categoryCounts: Record<string, number> = {};
  tickets.forEach((ticket) => {
    const category = ticket.category || "Onbekend";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Convert to chart data and sort by count (descending)
  const chartData = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      tickets: count,
    }))
    .sort((a, b) => b.tickets - a.tickets);

  // Get top 3 categories for summary
  const topCategories = chartData.slice(0, 3);
  const topCategoryNames = topCategories.map((c) => c.category).join(", ");

  return (
    <Card className="w-full">
      <CardHeader>
        {reviewRequired && (
          <ReportReviewCard
            reportId={reportId}
            chartId="tickets-per-category"
            description={chartDescription}
          />
        )}
        <CardTitle className="text-lg">Tickets per categorie</CardTitle>
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
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    tickMargin={8}
                    minTickGap={8}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        labelFormatter={(value) => `${value}`}
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
              De meeste tickets vallen in de categorieën:{" "}
              <strong>{topCategoryNames}</strong>. In totaal zijn er{" "}
              <strong>{chartData.length}</strong> verschillende categorieën
              geregistreerd in deze periode.
            </p> */}
            {chartDescription}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
