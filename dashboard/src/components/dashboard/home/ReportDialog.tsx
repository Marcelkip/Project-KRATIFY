"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from "react";
import { createReport } from "@/actions/create-report";
import { getReportsCountByType } from "@/actions/check-reports-count-by-type";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

// Validation schema
const formSchema = z
  .object({
    start_date: z.string().min(1, "Begin datum is verplicht"),
    end_date: z.string().min(1, "Eind datum is verplicht"),
    title: z.string().min(1).max(50),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "Eind datum moet na begin datum zijn",
    path: ["end_date"],
  })
  .refine((data) => new Date(data.start_date) <= new Date(), {
    message: "Begin datum mag niet in de toekomst liggen",
    path: ["start_date"],
  })
  .refine((data) => new Date(data.end_date) <= new Date(), {
    message: "Eind datum mag niet in de toekomst liggen",
    path: ["end_date"],
  });

export function ReportDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Loop pending, is it needed, no, but nice to have
  const checkPending = useCallback(async () => {
    try {
      const count = await getReportsCountByType("pending");
      setIsPending(count > 0 ? true : false);
    } catch (error) {
      console.error("Pending check failed:", error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [checkPending, isPending]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      title: "Rapportage " + new Date().toLocaleDateString("nl-NL"),
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (isPending) return;
    setIsPending(true);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("start_date", data.start_date);
    formData.append("end_date", data.end_date);

    createReport(formData);
    toast.success("Rapportage wordt aangemaakt!");
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="div">
        <DialogTrigger asChild>
          <Button variant="default" onClick={() => setOpen(true)}>
            Rapportage aanmaken
          </Button>
        </DialogTrigger>

        <form id="create_report" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rapportage aanmaken</DialogTitle>
              <DialogDescription>
                Het aanmaken van een rapportage kan enige tijd duren. Geef het
                de tijd.
              </DialogDescription>
              {isPending && (
                <p className="mt-2 text-sm text-red-600">
                  Er is al een rapportage in behandeling. Je moet even wachten
                  totdat de andere rapportage klaar is.
                </p>
              )}
            </DialogHeader>
            <FieldGroup className="grid gap-4">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-title">Titel</FieldLabel>
                    <Input
                      {...field}
                      id="form-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="Geef de rapportage een naam"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="start_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-start_date">
                      Begin datum
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-start_date"
                      aria-invalid={fieldState.invalid}
                      placeholder="Selecteer begin datum"
                      autoComplete="off"
                      type="date"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="end_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-end_date">Eind datum</FieldLabel>
                    <Input
                      {...field}
                      id="form-end_date"
                      aria-invalid={fieldState.invalid}
                      placeholder="Selecteer eind datum"
                      autoComplete="off"
                      type="date"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" form="create_report" disabled={isPending}>
                Aanmaken
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </div>
    </Dialog>
  );
}
