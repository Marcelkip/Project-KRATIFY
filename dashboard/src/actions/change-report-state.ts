"use server";

import { prisma } from "@/lib/prisma";

export async function changeReportState(
  reportId: number,
  newState: "pending" | "review_required" | "completed" | "failed",
) {
  return await prisma.report.update({
    where: { id: reportId },
    data: { status: newState },
  });
}
