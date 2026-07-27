import { Heatmap } from "@/components/Heatmap";
import type { DayCell } from "@/lib/types";

function groupCellLabel(cell: DayCell): string {
  const date = new Date(`${cell.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return cell.scheduled === 0
    ? `No group goals scheduled on ${date}`
    : `${cell.completed}/${cell.scheduled} group goals completed on ${date}`;
}

export function GroupHeatmap({ cells }: { cells: DayCell[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Group activity</p>
      <Heatmap cells={cells} cellLabel={groupCellLabel} />
    </div>
  );
}
