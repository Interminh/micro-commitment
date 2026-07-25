"use client";

import { useMemo, useState } from "react";
import type { DayCell } from "@/lib/types";

const DEFAULT_WEEKS = 12;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface TooltipState {
  label: string;
  x: number;
  y: number;
}

function bucketColor(completed: number, scheduled: number): string {
  if (scheduled === 0) return "var(--color-heat-unscheduled)";
  const ratio = completed / scheduled;
  if (ratio === 0) return "var(--color-heat-empty)";
  const step = Math.min(5, Math.ceil(ratio * 5));
  return `var(--color-heat-${step})`;
}

function cellLabel(cell: DayCell): string {
  const date = new Date(`${cell.date}T00:00:00Z`);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return cell.scheduled === 0
    ? `No goals scheduled on ${formatted}`
    : `${cell.completed}/${cell.scheduled} goals completed on ${formatted}`;
}

// Groups a contiguous, ascending-date array of cells into GitHub-style
// weekly columns (Sun-Sat rows), padding the first column so weekdays align.
function toColumns(cells: DayCell[]): (DayCell | null)[][] {
  if (cells.length === 0) return [];
  const firstWeekday = new Date(`${cells[0].date}T00:00:00Z`).getUTCDay();
  const padded: (DayCell | null)[] = [...Array(firstWeekday).fill(null), ...cells];

  const columns: (DayCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }
  return columns;
}

export function Heatmap({ cells }: { cells: DayCell[] }) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const allColumns = useMemo(() => toColumns(cells), [cells]);
  const columns = showFullHistory ? allColumns : allColumns.slice(-DEFAULT_WEEKS);
  const canExpand = allColumns.length > DEFAULT_WEEKS;

  const monthMarkers = columns.map((column, i) => {
    const firstRealCell = column.find((c) => c !== null);
    if (!firstRealCell) return null;
    const month = new Date(`${firstRealCell.date}T00:00:00Z`).getUTCMonth();
    const prevColumn = columns[i - 1];
    const prevFirstRealCell = prevColumn?.find((c) => c !== null);
    const prevMonth = prevFirstRealCell
      ? new Date(`${prevFirstRealCell.date}T00:00:00Z`).getUTCMonth()
      : null;
    return month !== prevMonth ? MONTH_LABELS[month] : null;
  });

  if (cells.length === 0) {
    return <p className="text-xs text-muted-foreground">No history yet.</p>;
  }

  function showTooltip(e: React.MouseEvent<HTMLDivElement>, cell: DayCell) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label: cellLabel(cell), x: rect.right, y: rect.top });
  }

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px]">
            {monthMarkers.map((label, i) => (
              <div key={i} className="w-[11px] text-[10px] text-muted-foreground">
                {label ?? ""}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-[3px]">
                {column.map((cell, rowIndex) =>
                  cell ? (
                    <div
                      key={rowIndex}
                      role="img"
                      aria-label={cellLabel(cell)}
                      onMouseEnter={(e) => showTooltip(e, cell)}
                      onMouseLeave={() => setTooltip(null)}
                      className="h-[11px] w-[11px] rounded-[2px]"
                      style={{ backgroundColor: bucketColor(cell.completed, cell.scheduled) }}
                    />
                  ) : (
                    <div key={rowIndex} className="h-[11px] w-[11px]" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 -translate-y-full whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-foreground shadow-lg"
          style={{ left: tooltip.x + 6, top: tooltip.y - 6 }}
        >
          {tooltip.label}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["var(--color-heat-empty)", "var(--color-heat-1)", "var(--color-heat-2)", "var(--color-heat-3)", "var(--color-heat-4)", "var(--color-heat-5)"].map(
            (color, i) => (
              <div
                key={i}
                className="h-[10px] w-[10px] rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ),
          )}
          <span>More</span>
        </div>

        {canExpand && (
          <button
            type="button"
            onClick={() => setShowFullHistory((v) => !v)}
            className="cursor-pointer text-xs font-medium text-brand hover:underline"
          >
            {showFullHistory ? "Show less" : "Show full history"}
          </button>
        )}
      </div>
    </div>
  );
}
