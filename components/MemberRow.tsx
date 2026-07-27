"use client";

import { useState } from "react";
import { GoalRow } from "@/components/GoalRow";
import { Heatmap } from "@/components/Heatmap";
import { KickMemberButton } from "@/components/KickMemberButton";
import { computeUiStatus } from "@/lib/goals";
import type { DailyLogStatus, DayCell } from "@/lib/types";

export interface MemberGoal {
  id: string;
  name: string;
  currentStreak: number;
  dueToday: boolean;
  loggedStatus: DailyLogStatus | null;
  // Only populated for the signed-in user's own goals — never sent to the
  // client for anyone else's, so only they can see their per-goal calendar.
  cells?: DayCell[];
}

const DOT_COLOR: Record<string, string> = {
  done: "bg-success",
  missed: "bg-danger",
  pending: "bg-pending",
};

export function MemberRow({
  name,
  avatarUrl,
  isSelf,
  memberId,
  groupId,
  goals,
  heatmapCells,
  canKick,
}: {
  name: string;
  avatarUrl: string | null;
  isSelf: boolean;
  memberId: string;
  groupId: string;
  goals: MemberGoal[];
  heatmapCells: DayCell[];
  canKick: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const dueGoals = goals.filter((g) => g.dueToday);
  const completedToday = dueGoals.filter((g) => g.loggedStatus === "done").length;

  return (
    <li className="rounded-lg border border-border bg-surface">
      <div className="flex w-full items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-border text-sm font-medium text-muted-foreground">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {name}
              {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
            </p>
            {dueGoals.length > 0 ? (
              <div className="mt-1 flex items-center gap-1">
                {dueGoals.map((g) => (
                  <span
                    key={g.id}
                    title={g.name}
                    className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[computeUiStatus(true, g.loggedStatus)]}`}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground italic">
                {goals.length === 0 ? "No goals set yet" : "Nothing due today"}
              </p>
            )}
          </div>

          {dueGoals.length > 0 && (
            <span className="shrink-0 font-mono text-sm text-muted-foreground tabular-nums">
              {completedToday}/{dueGoals.length}
            </span>
          )}

          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {canKick && !isSelf && (
          <KickMemberButton groupId={groupId} memberId={memberId} memberName={name} />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {goals.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No goals set yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goalId={goal.id}
                  groupId={groupId}
                  name={goal.name}
                  currentStreak={goal.currentStreak}
                  isDue={goal.dueToday}
                  loggedStatus={goal.loggedStatus}
                  isOwner={isSelf}
                  cells={goal.cells}
                />
              ))}
            </div>
          )}

          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {isSelf ? "Your activity" : `${name}'s activity`}
            </p>
            <Heatmap cells={heatmapCells} />
          </div>
        </div>
      )}
    </li>
  );
}
