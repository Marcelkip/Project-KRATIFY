"use server";

import { prisma } from "@/lib/prisma";

export async function getReportsCountByType(
  type: "pending" | "review_required" | "completed" | "failed",
) {
  return await prisma.report.count({
    where: { status: type },
  });
}
