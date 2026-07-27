"use client";

import { useMemo, useState } from "react";
import { fillYear } from "@/lib/heatmap";
import type { DayCell } from "@/lib/types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const LEGEND_COLORS = [
  "var(--color-heat-empty)",
  "var(--color-heat-1)",
  "var(--color-heat-2)",
  "var(--color-heat-3)",
  "var(--color-heat-4)",
  "var(--color-heat-5)",
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

// Per-goal calendars aren't a magnitude scale — a day is either done,
// missed, or not due — so they get a flat done/missed/blank read instead of
// the 5-step ramp used for group and personal activity.
function binaryColor(completed: number, scheduled: number): string {
  if (scheduled === 0) return "transparent";
  return completed > 0 ? "var(--color-success)" : "var(--color-danger)";
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function defaultCellLabel(cell: DayCell): string {
  return cell.scheduled === 0
    ? `No goals scheduled on ${formatDate(cell.date)}`
    : `${cell.completed}/${cell.scheduled} goals completed on ${formatDate(cell.date)}`;
}

// Splits a contiguous run of dates into GitHub-style weekly columns
// (Sun-Sat rows), padding the first column so the weekdays line up.
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

export function Heatmap({
  cells,
  cellLabel = defaultCellLabel,
  variant = "scale",
}: {
  cells: DayCell[];
  cellLabel?: (cell: DayCell) => string;
  variant?: "scale" | "binary";
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const colorFor = variant === "binary" ? binaryColor : bucketColor;

  const year = useMemo(() => {
    const last = cells[cells.length - 1];
    return last ? new Date(`${last.date}T00:00:00Z`).getUTCFullYear() : new Date().getUTCFullYear();
  }, [cells]);

  const yearCells = useMemo(() => fillYear(cells, year), [cells, year]);
  const columns = useMemo(() => toColumns(yearCells), [yearCells]);

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

  function showTooltip(e: React.MouseEvent<HTMLDivElement>, cell: DayCell) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label: cellLabel(cell), x: rect.right, y: rect.top });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px] pl-6">
            {monthMarkers.map((label, i) => (
              <div key={i} className="w-[13px] text-[11px] text-muted-foreground">
                {label ?? ""}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            <div className="flex w-6 flex-col gap-[3px]">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="h-[13px] text-[10px] leading-[13px] text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>

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
                      className="h-[13px] w-[13px] rounded-[3px] border border-black/[0.04] dark:border-white/[0.04]"
                      style={{ backgroundColor: colorFor(cell.completed, cell.scheduled) }}
                    />
                  ) : (
                    <div key={rowIndex} className="h-[13px] w-[13px]" />
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

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Hover a square to see that day&apos;s completions.
        </p>
        {variant === "binary" ? (
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: "var(--color-success)" }} />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: "var(--color-danger)" }} />
              Missed
            </span>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <span>Less</span>
            {LEGEND_COLORS.map((color, i) => (
              <div key={i} className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: color }} />
            ))}
            <span>More</span>
          </div>
        )}
      </div>
    </div>
  );
}
