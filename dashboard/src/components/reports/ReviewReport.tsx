"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilePenIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { saveChartDescription } from "@/actions/save-description";
import { saveReviewedReport } from "@/actions/review-report";

function ReportChangeDescriptionDialog({
  chartId,
  reportId,
  description: initialDescription,
}: {
  chartId: string;
  reportId: number;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription]);

  async function onSubmit() {
    console.log("Chart ID:", chartId);
    console.log("Nieuwe beschrijving:", description);
    console.log("Reden wijziging:", reason);

    const success = await saveChartDescription(
      reportId,
      chartId,
      description,
      reason,
    );
    if (success) {
      toast.success("Beschrijving is aangepast");
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } else {
      toast.error("Opslaan mislukt");
    }

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="div">
        <DialogTrigger asChild>
          <Button variant="default" onClick={() => setOpen(true)}>
            <FilePenIcon />
          </Button>
        </DialogTrigger>

        <form
          id="change-chart-description"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <DialogContent className="sm:max-w-[425px] lg:max-w-fit">
            <DialogHeader>
              <DialogTitle>Beschrijving aanpassen</DialogTitle>
              <DialogDescription>
                Pas de beschrijving aan en geef een reden voor de wijziging.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-row space-x-6 h-[30vh]">
              <div className="space-y-2 flex flex-col w-[20vw]">
                <Label>Beschrijving</Label>
                <textarea
                  className="rounded-md h-full p-2 w-full outline-none border-solid border-2 border-black/40 focus-within:border-black transition-all duration-150 ease-in-out"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={initialDescription}
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Aanbevelingen voor de AI</Label>
                <p className="text-sm">
                  Denk hierbij aan extra datums waar de AI mee moet checken
                </p>
                <textarea
                  className="rounded-md h-full p-2 w-full outline-none border-solid border-2 border-black/40 focus-within:border-black transition-all duration-150 ease-in-out"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="3 April is goede vrijdag. Op deze dag behandelen wij geen tickets"
                />
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-row items-center justify-between w-full">
                <p className="text-black/60 text-sm">Chart ID: #{chartId}</p>
                <Button type="submit" form="change-chart-description">
                  Opslaan
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </form>
      </div>
    </Dialog>
  );
}

export function ReportReviewCard({
  chartId,
  reportId,
  description,
}: {
  chartId: string;
  reportId: number;
  description: string;
}) {
  const [approved, setApproved] = useState(false);

  function handleApprove() {
    setApproved(!approved);
  }

  return (
    <Card
      className={`transition-all duration-300 ease-in-out ${approved ? "border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-800" : "border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-800"} p-2 py-4`}
    >
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Goedkeuren</CardTitle>
        <div className="flex flex-row gap-x-4">
          <input
            type="checkbox"
            name={`approved-${chartId}`}
            id={`approved-${chartId}`}
            readOnly
            checked={approved}
            className="hidden"
            data-approve-checkbox
          />
          <Button
            variant={approved ? "success" : "destructive"}
            onClick={handleApprove}
            className="w-auto transition-all duration-300 ease-in-out"
          >
            {approved ? "Goedgekeurd" : "Niet goedgekeurd"}
          </Button>
          <ReportChangeDescriptionDialog
            chartId={chartId}
            reportId={reportId}
            description={description}
          />
        </div>
      </CardHeader>
    </Card>
  );
}

function ReviewDialog({ reportId }: { reportId: number }) {
  const [open, setOpen] = useState(false);

  async function onSubmitApprove() {
    // Get all approved descriptions and get the ids of the approved charts
    const approvedCharts = document.querySelectorAll(
      "input[type='checkbox'][data-approve-checkbox]",
    );

    const approvedChartIds: string[] = [];
    approvedCharts.forEach((checkbox) => {
      if (!(checkbox as HTMLInputElement).checked) {
        return;
      }

      const chartId = checkbox.id.replace("approved-", "");
      approvedChartIds.push(chartId);
    });

    console.log("Approved charts:", approvedChartIds);

    // if not all sections are approved, show a warning toast
    if (approvedChartIds.length < approvedCharts.length) {
      toast.error(
        "Niet alle grafieken zijn goedgekeurd. Zorg ervoor dat je alle grafieken goedkeurt voordat je de rapportage goedkeurt.",
      );
      setOpen(false);
      return;
    }

    try {
      const result = await saveReviewedReport(reportId);
      if (result.success) {
        toast.success("Rapportage is goed gekeurd");
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      } else {
        toast.error("Opslaan mislukt");
      }
    } catch (error) {
      toast.error("Opslaan mislukt");
      console.log(error);
    }

    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="div">
        <DialogTrigger asChild>
          <Button variant="default" onClick={() => setOpen(true)}>
            Review Rapportage
          </Button>
        </DialogTrigger>

        <form
          id="review_report"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitApprove();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Review Rapportage</DialogTitle>
              <DialogDescription>
                Controleer of de informatie klopt. Indien het bij bepaalde
                onderdelen niet correct is kan je de beschrijving van de
                grafieken aanpassen, hierbij kan je een reden doorgeven zodat de
                AI de volgende keer de opmerking mee neemt.
                <br />
                <br />
                <b>LET OP:</b> Wanneer je de rapportage goedkeurt, zal deze
                worden gemarkeerd als compleet en kan deze niet meer worden
                aangepast. Zorg er dus voor dat je alle grafieken goed
                controleert voordat je de rapportage goedkeurt.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="submit" form="review_report">
                Goedkeuren
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </div>
    </Dialog>
  );
}

// Map entry types to chart keys and colors
export default function ReportReviewRequired({
  reportId,
}: {
  reportId: number;
}) {
  useEffect(() => {
    // Add a checkbox to each section for approval
    const sections = document.querySelectorAll(".report-section");
    sections.forEach((section) => {
      const label = section.getAttribute("data-label") || "Section";
      const id = section.id || label.toLowerCase().replace(/\s+/g, "-");
    });
  }, []);

  if (!reportId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Rapportage niet gevonden</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            De opgevraagde rapportage kon niet worden gevonden. Controleer of
            het ID correct is en probeer het opnieuw.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-800">
      <CardHeader>
        <CardTitle>LET OP!</CardTitle>
      </CardHeader>
      <CardContent>
        Deze rapportage is klaar, maar vereist nog een laatste controle. In deze
        controle kan je kijken of de grafieken kloppen. Indien het bij bepaalde
        onderdelen niet correct is kan je de beschrijving van de grafieken
        aanpassen, hierbij kan je een reden doorgeven zodat de AI in de toekomst
        de opmerking mee neemt.
      </CardContent>
      <CardFooter>
        <ReviewDialog reportId={reportId} />
      </CardFooter>
    </Card>
  );
}
