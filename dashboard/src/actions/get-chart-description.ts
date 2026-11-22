"use server";

import { prisma } from "@/lib/prisma";

export async function getChartDescription(reportId: number, chartId: string) {
  const data = await prisma.chartDescriptions.findFirst({
    where: { reportId: reportId, chartType: chartId },
  });
  return data?.description;
}
