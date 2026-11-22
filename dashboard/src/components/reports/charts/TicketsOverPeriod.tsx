"use client";

import { Button } from "@/components/ui/button";
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
import { getChartDescription } from "@/actions/get-chart-description";
import { useEffect, useState } from "react";

type Ticket = {
  callDate: Date | null;
  processingStatus: string | null;
  closed: boolean;
};

interface Props {
  tickets: Ticket[];
  reportId: number;
  reviewRequired?: boolean;
}

const chartConfig = {
  answered: {
    label: "Afgehandeld",
    color: "#2563eb",
  },
  un_answered: {
    label: "Niet afgehandeld",
    color: "#10b981",
  },
} satisfies ChartConfig;

export default function TicketsOverPeriod({
  tickets,
  reportId,
  reviewRequired,
}: Props) {
  const [chartDescription, setChartDescription] =
    useState<string>("Loading...");
  // Filter out tickets with null callDate
  const validTickets = tickets.filter((t) => t.callDate !== null);

  // Load description
  useEffect(() => {
    async function fetch() {
      const data = await getChartDescription(reportId, "tickets-over-period");
      setChartDescription(data || "Loading...");
    }
    fetch();
  }, [reportId]);

  if (validTickets.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Tickets over periode</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Geen tickets beschikbaar voor deze periode.</p>
        </CardContent>
      </Card>
    );
  }

  // Parse dates and find the range
  const parsedTickets = validTickets.map((t) => ({
    ...t,
    callDate: new Date(t.callDate!),
  }));

  const dates = parsedTickets.map((t) => t.callDate);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Generate all dates in range
  const dateRange: Date[] = [];
  const currentDate = new Date(minDate);
  while (currentDate <= maxDate) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count tickets per day
  const chartData = dateRange.map((date) => {
    const dayTickets = parsedTickets.filter(
      (t) =>
        t.callDate.getFullYear() === date.getFullYear() &&
        t.callDate.getMonth() === date.getMonth() &&
        t.callDate.getDate() === date.getDate(),
    );

    const answered = dayTickets.filter(
      (t) => t.closed || t.processingStatus === "Afgehandeld",
    ).length;
    const un_answered = dayTickets.length - answered;

    return {
      date: date.toISOString(),
      answered,
      un_answered,
    };
  });

  // Find peak day
  const maxTicketsDay = chartData.reduce(
    (max, day) =>
      day.answered + day.un_answered > max.answered + max.un_answered
        ? day
        : max,
    chartData[0],
  );
  const peakDate = new Date(maxTicketsDay.date);
  const peakTotal = maxTicketsDay.answered + maxTicketsDay.un_answered;

  return (
    <Card className="w-full">
      <CardHeader>
        {reviewRequired && (
          <ReportReviewCard
            reportId={reportId}
            chartId="tickets-over-period"
            description={chartDescription}
          />
        )}
        <CardTitle className="text-lg">Tickets over periode</CardTitle>
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
                    dataKey="date"
                    tickLine={false}
                    tickMargin={8}
                    minTickGap={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("nl", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("nl", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="answered"
                    fill="var(--color-answered)"
                    radius={4}
                  />
                  <Bar
                    dataKey="un_answered"
                    fill="var(--color-un_answered)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Analyze */}
          <div className="">
            {/* <p>
              Over deze periode zijn er in totaal{" "}
              <strong>{validTickets.length}</strong> tickets geregistreerd. Het
              hoogste aantal tickets ({peakTotal}) was op{" "}
              <strong>{peakDate.toLocaleDateString("nl")}</strong>.
            </p> */}
            <p>{chartDescription}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
