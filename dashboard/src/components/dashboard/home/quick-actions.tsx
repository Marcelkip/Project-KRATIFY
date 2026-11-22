"use client";

import { Button } from "@/components/ui/button";

type QuickAction = {
  label: string;
  onClick?: () => void;
};

type QuickActionsProps = {
  actions?: QuickAction[];
};

const defaultActions: QuickAction[] = [
  { label: "Snelkoppeling 1" },
  { label: "Snelkoppeling 2" },
  { label: "Snelkoppeling 3" },
];

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-4">
      {actions.map((action, idx) => (
        <div className="flex-1" key={idx}>
          <Button
            variant="default"
            className="w-full h-12"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      ))}
    </div>
  );
}
