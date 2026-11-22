"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createReport(formData: FormData) {
  "use server";

  console.log("test");

  const formTitle =
    formData.get("title") ||
    (`Rapportage ${new Date().toLocaleDateString("nl-NL")}` as string);
  const formStartDate = formData.get("start_date") as string;
  const formEndDate = formData.get("end_date") as string;

  const startDateIso = new Date(formStartDate).toISOString();
  // const endDateIso = new Date(formEndDate).toISOString();

  const endDate = new Date(formEndDate);
  endDate.setHours(23, 59, 59, 999);
  const endDateIso = endDate.toISOString();

  // Create report
  const report = await prisma.report.create({
    // fixed model name
    data: {
      dates: {
        startDate: startDateIso,
        endDate: endDateIso,
      },
      status: "pending",
      title: formTitle as string,
    },
  });

  console.log("Report created:", report);

  // Trigger AI processing
  fetch(
    `${process.env.API_URL}/generate?reportId=${report.id}&startDate=${startDateIso}&endDate=${endDateIso}`,
    {
      method: "GET",
    },
  )
    .then(async (response) => {
      console.log(response);
      return response.json();
    })
    .catch(async () => {
      await prisma.report.update({
        where: {
          id: report.id,
        },
        data: {
          status: "failed",
        },
      });
    });

  revalidatePath("/"); // refresh dashboard
}
