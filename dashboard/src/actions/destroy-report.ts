"use server";

import { prisma } from "@/lib/prisma";

export async function destroyReport(reportId: number) {
  return await prisma.report.delete({
    where: { id: reportId },
  });
}
