"use client";

import { useState, useTransition } from "react";
import { archiveGoal } from "@/lib/actions";
import { computeUiStatus } from "@/lib/goals";
import { StreakBadge } from "@/components/StreakBadge";
import { DailyLogButtons } from "@/components/DailyLogButtons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Heatmap } from "@/components/Heatmap";
import type { DailyLogStatus, DayCell, UiStatus } from "@/lib/types";

function goalCellLabel(cell: DayCell): string {
  const formatted = new Date(`${cell.date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  if (cell.scheduled === 0) return `Not due on ${formatted}`;
  return cell.completed > 0 ? `Done on ${formatted}` : `Missed on ${formatted}`;
}

function StatusBadge({ status }: { status: UiStatus }) {
  const styles: Record<UiStatus, string> = {
    done: "bg-success-bg text-success",
    missed: "bg-danger-bg text-danger",
    pending: "bg-pending-bg text-pending",
    not_due: "bg-pending-bg text-pending",
  };
  const labels: Record<UiStatus, string> = {
    done: "Done today",
    missed: "Missed",
    pending: "Pending",
    not_due: "Not due today",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function GoalRow({
  goalId,
  groupId,
  name,
  currentStreak,
  isDue,
  loggedStatus,
  isOwner,
  cells,
}: {
  goalId: string;
  groupId: string;
  name: string;
  currentStreak: number;
  isDue: boolean;
  loggedStatus: DailyLogStatus | null;
  isOwner: boolean;
  cells?: DayCell[];
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPending, startTransition] = useTransition();
  const status = computeUiStatus(isDue, loggedStatus);
  const canShowCalendar = isOwner && cells !== undefined;

  function handleArchive() {
    startTransition(async () => {
      await archiveGoal(goalId, groupId);
      setConfirmOpen(false);
    });
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        {canShowCalendar && (
          <button
            type="button"
            onClick={() => setShowCalendar((v) => !v)}
            aria-expanded={showCalendar}
            aria-label={showCalendar ? "Hide calendar" : "Show calendar"}
            className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              viewBox="0 0 20 20"
              className={`h-3.5 w-3.5 transition-transform ${showCalendar ? "rotate-90" : ""}`}
              aria-hidden="true"
            >
              <path d="M7 5l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <StreakBadge current={currentStreak} />
        </div>

        {isOwner && status === "pending" ? (
          <DailyLogButtons goalId={goalId} groupId={groupId} initialStatus={null} />
        ) : (
          <StatusBadge status={status} />
        )}

        {isOwner && (
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="cursor-pointer text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
            >
              Archive
            </button>
            <ConfirmDialog
              open={confirmOpen}
              title={`Archive "${name}"?`}
              description="This hides the goal going forward but keeps its history and streak. You can't unarchive it from here yet."
              confirmLabel="Archive"
              danger
              pending={isPending}
              onConfirm={handleArchive}
              onCancel={() => setConfirmOpen(false)}
            />
          </>
        )}
      </div>

      {canShowCalendar && showCalendar && cells && (
        <div className="mt-3 pl-6">
          <Heatmap cells={cells} cellLabel={goalCellLabel} />
        </div>
      )}
    </div>
  );
}
