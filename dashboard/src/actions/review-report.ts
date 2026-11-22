"use server";

import { prisma } from "@/lib/prisma";

export type SaveReviewedReportResult =
  | { success: true }
  | {
      success: false;
      error: {
        code:
          | "NOT_FOUND"
          | "INVALID_STATUS"
          | "MISSING_APPROVALS"
          | "CATCH_ERROR";
        message: string;
      };
    };

export async function saveReviewedReport(
  reportId: number,
): Promise<SaveReviewedReportResult> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Report not found",
      },
    };
  }

  if (report.status !== "review_required") {
    return {
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: "Report is not in a reviewable state",
      },
    };
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "completed" },
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: { code: "CATCH_ERROR", message: errorMessage },
    };
  }
}
