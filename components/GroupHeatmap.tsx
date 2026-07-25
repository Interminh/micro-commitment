import { Heatmap } from "@/components/Heatmap";
import type { DayCell } from "@/lib/types";

export function GroupHeatmap({ cells }: { cells: DayCell[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Group activity
      </p>
      <div className="mt-3">
        <Heatmap cells={cells} />
      </div>
    </div>
  );
}
