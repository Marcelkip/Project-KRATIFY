import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export async function HeroSection() {
  const latestReport = await prisma.report.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Melding</CardTitle>
        <CardDescription className="text-3xl font-medium mb-4 text-black dark:text-white">
          Er is een nieuwe rapportage beschikbaar.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {latestReport ? (
          <Link href={`/reports/${latestReport.id}`}>
            <Button
              variant="default"
              className="w-auto max-w-max inline-block pl-6 pr-6"
            >
              Open
            </Button>
          </Link>
        ) : (
          <Button disabled variant="default">
            Geen rapportages beschikbaar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
