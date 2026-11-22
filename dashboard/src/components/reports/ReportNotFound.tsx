import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ArrowUpRightIcon, FolderOpen } from "lucide-react";

export function ReportNotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpen />
        </EmptyMedia>
        <EmptyTitle>Rapportage niet gevonden</EmptyTitle>
        <EmptyDescription>
          Het opgegeven rapportage id kan niet terug gevonden worden.
          Controlleer de url.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>Terug naar home</Button>
      </EmptyContent>
    </Empty>
  );
}
