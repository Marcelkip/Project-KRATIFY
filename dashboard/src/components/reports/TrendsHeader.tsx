"use client";

import { getTrendsData } from "@/actions/get-trends-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { JsonValue } from "../../../prisma/generated/prisma/runtime/client";

interface TrendsData {
  success: boolean;
  reason?: string;
  data?: Trends;
}

interface RecommendedAction {
  priority: number;
  expected_impact: "high" | "medium" | "low";
  title: string;
  why: string;
}

interface Trends {
  summary: string;
  highlights: JsonValue | null;
  risks: JsonValue | null;
  recommendedActions: JsonValue | null;
  reportId: number | null;
}

export default function TrendsHeader({ reportId }: { reportId: number }) {
  const [trendsData, setTrendsData] = useState<TrendsData>({
    success: false,
    reason: "Bezig met ophalen...",
  });

  // Load description
  useEffect(() => {
    async function fetch() {
      const data = await getTrendsData(reportId);

      console.log(data);
      if (data instanceof Object) {
        setTrendsData({ success: true, data: data });
      } else {
        setTrendsData({ success: false, reason: "Geen trends gevonden" });
      }
    }

    fetch();
  }, [reportId]);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Trends & Opvallende waardes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <p>
              Onder dit tabblad zullen we de trends plaatsen die pieken in deze
              rapportage. Denk aan opvallende waardes zoals categorieën met een
              uitzonderlijk hoog aantal tickets, locaties met veel activiteit of
              patronen in binnenkomsttype.
            </p>
          </div>
        </CardContent>
      </Card>

      {!trendsData.success && trendsData.reason && <p>{trendsData.reason}</p>}

      {trendsData.data && (
        <div className="space-y-4 mt-4">
          {/* <div className="">
            <p>{trendsData.data.summary}</p>
          </div> */}

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Bijzonderheden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                {Array.isArray(trendsData.data.highlights) &&
                  (trendsData.data.highlights as string[]).map(
                    (highlight, index) => <p key={index}>{highlight}</p>,
                  )}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Risicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                {Array.isArray(trendsData.data.risks) &&
                  (trendsData.data.risks as string[]).map((risk, index) => (
                    <p key={index}>{risk}</p>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Aanbevolen acties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(trendsData.data.recommendedActions) &&
                    (
                      trendsData.data
                        .recommendedActions as unknown as RecommendedAction[]
                    )
                      .sort((a, b) => b.priority - a.priority)
                      .map((action, index) => (
                        <div
                          key={index}
                          className="rounded-lg bg-background p-4 flex flex-col space-y-4"
                        >
                          <div className="flex flex-wrap space-x-2">
                            {/* <div className="flex flex-col space-y-2 p-2 py-1 pt-0.5 rounded-md h-full aspect-square items-center justify-center bg-primary text-white">
                              <p>{action.priority}</p>
                            </div> */}
                            <div
                              className={`rounded-md w-fit px-2 py-1 pt-0.5 h-fit items-center justify-center ${action.expected_impact == "high" ? "bg-teal-400" : action.expected_impact == "medium" ? "bg-orange-300" : "bg-red-300"}`}
                            >
                              <p>
                                Impact:{" "}
                                {action.expected_impact == "high"
                                  ? "Hoog"
                                  : action.expected_impact == "medium"
                                    ? "Gemiddeld"
                                    : "Laag"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2">
                            <h4 className="text-xl">{action.title}</h4>
                            <p>{action.why}</p>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
