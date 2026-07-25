import { StreakBadge } from "@/components/StreakBadge";
import { CheckInButtons } from "@/components/CheckInButtons";
import type { CheckInStatus } from "@/lib/types";

export function MemberRow({
  name,
  avatarUrl,
  isSelf,
  commitmentLabel,
  currentStreak,
  todayStatus,
  dueToday,
  commitmentId,
  groupId,
}: {
  name: string;
  avatarUrl: string | null;
  isSelf: boolean;
  commitmentLabel: string | null;
  currentStreak: number;
  todayStatus: CheckInStatus | null;
  dueToday: boolean;
  commitmentId: string | null;
  groupId: string;
}) {
  const missed = todayStatus === "missed";

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        missed ? "border-danger/30 bg-danger-bg" : "border-border bg-surface"
      }`}
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
        {commitmentLabel ? (
          <p className="truncate text-xs text-muted-foreground">{commitmentLabel}</p>
        ) : (
          <p className="truncate text-xs text-muted-foreground italic">
            No commitment set yet
          </p>
        )}
      </div>

      {commitmentLabel && <StreakBadge current={currentStreak} />}

      <div className="shrink-0">
        {!commitmentLabel ? null : !dueToday ? (
          <span className="inline-flex items-center rounded-full bg-pending-bg px-2.5 py-1 text-xs font-medium text-pending">
            Not due today
          </span>
        ) : isSelf && commitmentId ? (
          <CheckInButtons
            commitmentId={commitmentId}
            groupId={groupId}
            initialStatus={todayStatus}
          />
        ) : todayStatus === "done" ? (
          <span className="inline-flex items-center rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
            Done today
          </span>
        ) : todayStatus === "missed" ? (
          <span className="inline-flex items-center rounded-full bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger">
            Missed
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-pending-bg px-2.5 py-1 text-xs font-medium text-pending">
            Pending
          </span>
        )}
      </div>
    </li>
  );
}
