"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type Section = { id: string; title: string | null };

export default function IndexCard() {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(
      "section.report-section",
    );
    const nextSections: Section[] = [];

    elements.forEach((section) => {
      const id =
        section.id ||
        section.textContent?.toLowerCase().trim().replace(/\s+/g, "-");

      if (id) {
        if (!section.id) section.id = id; // ensure anchor target exists
        nextSections.push({
          id,
          title: section.getAttribute("data-label") || section.textContent,
        });
      }
    });

    setSections(nextSections);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Inhouds informatie</CardTitle>
        <nav className="flex flex-col gap-2 mt-4">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm flex flex-row gap-2 group"
            >
              {">"}
              <p className="group-hover:text-blue-600 text-blue-400 -mb-0.5">
                {section.title}
              </p>
            </a>
          ))}
        </nav>
      </CardHeader>
    </Card>
  );
}
