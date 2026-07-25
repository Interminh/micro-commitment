"use client";

import { useState, useTransition } from "react";
import { archiveGoal } from "@/lib/actions";
import { computeUiStatus } from "@/lib/goals";
import { StreakBadge } from "@/components/StreakBadge";
import { DailyLogButtons } from "@/components/DailyLogButtons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { DailyLogStatus, UiStatus } from "@/lib/types";

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
}: {
  goalId: string;
  groupId: string;
  name: string;
  currentStreak: number;
  isDue: boolean;
  loggedStatus: DailyLogStatus | null;
  isOwner: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const status = computeUiStatus(isDue, loggedStatus);

  function handleArchive() {
    startTransition(async () => {
      await archiveGoal(goalId, groupId);
      setConfirmOpen(false);
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
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
  );
}
