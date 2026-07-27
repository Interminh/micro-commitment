"use client";

import { useState, useTransition } from "react";
import { setGroupJoinLock } from "@/lib/actions";

export function GroupJoinLockToggle({
  groupId,
  initialLocked,
}: {
  groupId: string;
  initialLocked: boolean;
}) {
  const [locked, setLocked] = useState(initialLocked);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !locked;
    setError(null);
    setLocked(next);
    startTransition(async () => {
      const result = await setGroupJoinLock(groupId, next);
      if (result.error) {
        setError(result.error);
        setLocked(!next);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-2">
      <div className="min-w-0 pl-1">
        <p className="text-sm font-medium">
          {locked ? "Joining is locked" : "Joining is open"}
        </p>
        <p className="text-xs text-muted-foreground">
          {locked
            ? "No one can join with the invite link right now."
            : "Anyone with the invite link can join."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={locked}
        onClick={toggle}
        disabled={isPending}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          locked ? "bg-pending" : "bg-brand"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            locked ? "translate-x-0" : "translate-x-5"
          }`}
        />
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
