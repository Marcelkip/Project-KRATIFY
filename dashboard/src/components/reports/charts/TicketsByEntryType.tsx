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
  callDate: Date | null;
  entryType: string | null;
};

interface Props {
  tickets: Ticket[];
  reportId: number;
  reviewRequired?: boolean;
}

// Map entry types to chart keys and colors
const entryTypeMap: Record<
  string,
  { key: string; label: string; color: string }
> = {
  Telefonisch: { key: "phone", label: "Telefonisch", color: "#2563eb" },
  "E-mail": { key: "mail", label: "E-mail", color: "#f97316" },
  Selfservice: { key: "self_service", label: "Selfservice", color: "#10b981" },
  Mondeling: { key: "in_person", label: "Mondeling", color: "#8b5cf6" },
};

export default function TicketsByEntryType({
  tickets,
  reportId,
  reviewRequired,
}: Props) {
  const [chartDescription, setChartDescription] =
    useState<string>("Loading...");

  // Load description
  useEffect(() => {
    async function fetch() {
      const data = await getChartDescription(reportId, "tickets-by-entry-type");
      setChartDescription(data || "Loading...");
    }
    fetch();
  }, [reportId]);

  // Filter out tickets with null callDate
  const validTickets = tickets.filter((t) => t.callDate !== null);

  if (validTickets.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">
            Tickets per ingangstype over tijd
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Geen tickets beschikbaar voor deze periode.</p>
        </CardContent>
      </Card>
    );
  }

  // Parse dates
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

  // Count tickets per day per entry type
  const chartData: Array<{
    date: string;
    phone: number;
    mail: number;
    self_service: number;
    in_person: number;
  }> = dateRange.map((date) => {
    const dayTickets = parsedTickets.filter(
      (t) =>
        t.callDate.getFullYear() === date.getFullYear() &&
        t.callDate.getMonth() === date.getMonth() &&
        t.callDate.getDate() === date.getDate(),
    );

    const counts: Record<string, number> = {
      phone: 0,
      mail: 0,
      self_service: 0,
      in_person: 0,
    };

    dayTickets.forEach((ticket) => {
      const entryType = ticket.entryType || "Onbekend";
      const mapped = entryTypeMap[entryType];
      if (mapped) {
        counts[mapped.key]++;
      }
    });

    return {
      date: date.toISOString(),
      phone: counts.phone,
      mail: counts.mail,
      self_service: counts.self_service,
      in_person: counts.in_person,
    };
  });

  // Calculate totals per entry type
  const totals = {
    phone: chartData.reduce((sum, day) => sum + day.phone, 0),
    mail: chartData.reduce((sum, day) => sum + day.mail, 0),
    self_service: chartData.reduce((sum, day) => sum + day.self_service, 0),
    in_person: chartData.reduce((sum, day) => sum + day.in_person, 0),
  };

  // Find most common entry type
  const mostCommon = Object.entries(totals).reduce(
    (max, [key, count]) => (count > max.count ? { key, count } : max),
    { key: "", count: 0 },
  );

  const mostCommonLabel =
    Object.values(entryTypeMap).find((m) => m.key === mostCommon.key)?.label ||
    "Onbekend";

  // Build dynamic chart config
  const chartConfig: ChartConfig = {};
  Object.values(entryTypeMap).forEach((mapping) => {
    chartConfig[mapping.key] = {
      label: mapping.label,
      color: mapping.color,
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        {reviewRequired && (
          <ReportReviewCard
            reportId={reportId}
            chartId="tickets-by-entry-type"
            description={chartDescription}
          />
        )}
        <CardTitle className="text-lg">
          Tickets per ingangstype over tijd
        </CardTitle>
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
                        labelFormatter={(value) =>
                          new Date(value).toLocaleDateString("nl", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="phone" fill="var(--color-phone)" radius={4} />
                  <Bar
                    dataKey="self_service"
                    fill="var(--color-self_service)"
                    radius={4}
                  />
                  <Bar dataKey="mail" fill="var(--color-mail)" radius={4} />
                  <Bar
                    dataKey="in_person"
                    fill="var(--color-in_person)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Analyze */}
          <div className="">
            {/* <p>
              Het meest gebruikte ingangstype is{" "}
              <strong>{mostCommonLabel}</strong> met{" "}
              <strong>{mostCommon.count}</strong> tickets. In totaal zijn er{" "}
              <strong>{totals.phone}</strong> telefonische tickets,{" "}
              <strong>{totals.mail}</strong> e-mailtickets,{" "}
              <strong>{totals.self_service}</strong> selfservice tickets en{" "}
              <strong>{totals.in_person}</strong> mondelinge tickets
              geregistreerd.
            </p> */}
            <p>{chartDescription}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
