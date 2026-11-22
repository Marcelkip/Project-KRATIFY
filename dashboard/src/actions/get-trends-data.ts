"use server";

import { prisma } from "@/lib/prisma";

export async function getTrendsData(reportId: number) {
  const data = await prisma.reportTrendsSummary.findFirst({
    where: { reportId: reportId },
  });
  return data;
}
