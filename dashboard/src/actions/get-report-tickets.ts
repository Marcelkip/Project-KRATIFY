"use server";

import { prisma } from "@/lib/prisma";

export async function getReportTickets(id: number) {
  return await prisma.ticket.findMany({
    where: { reportId: id },
  });
}
