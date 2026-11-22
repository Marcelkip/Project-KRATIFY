"use server";

import { prisma } from "@/lib/prisma";

export async function getReportDetails(id: number) {
  return await prisma.report.findUnique({
    where: { id },
  });
}
