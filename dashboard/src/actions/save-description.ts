"use server";

import { prisma } from "@/lib/prisma";

export async function saveChartDescription(
  reportId: number,
  chartId: string,
  description: string,
  changeReason?: string,
) {
  try {
    await prisma.chartDescriptions.update({
      where: {
        reportId_chartType: {
          reportId,
          chartType: chartId,
        },
      },
      data: { description: description, changeReason: changeReason },
    });
    return true;
  } catch (error) {
    console.error("saveChartDescription error", error);
    return false;
  }
}
