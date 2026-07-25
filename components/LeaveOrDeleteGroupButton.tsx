"use client";

import { useState, useTransition } from "react";
import { leaveGroup, deleteGroup } from "@/lib/actions";

export function LeaveOrDeleteGroupButton({
  groupId,
  groupName,
  isHost,
}: {
  groupId: string;
  groupName: string;
  isHost: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const message = isHost
      ? `Delete "${groupName}" for everyone? This can't be undone.`
      : `Leave "${groupName}"?`;
    if (!window.confirm(message)) return;

    setError(null);
    startTransition(async () => {
      const result = isHost ? await deleteGroup(groupId) : await leaveGroup(groupId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "..." : isHost ? "Delete" : "Leave"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
