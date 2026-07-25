"use client";

import { useState, useTransition } from "react";
import { leaveGroup, deleteGroup } from "@/lib/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function LeaveOrDeleteGroupButton({
  groupId,
  groupName,
  isHost,
}: {
  groupId: string;
  groupName: string;
  isHost: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = isHost ? await deleteGroup(groupId) : await leaveGroup(groupId);
      if (result.error) {
        setError(result.error);
      }
      setConfirmOpen(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
      >
        {isHost ? "Delete" : "Leave"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={isHost ? `Delete "${groupName}"?` : `Leave "${groupName}"?`}
        description={
          isHost
            ? "This deletes the group for everyone in it, along with all commitments, check-ins, and streaks. This can't be undone."
            : "You'll lose access to this group and your commitment in it. You can rejoin later with an invite link."
        }
        confirmLabel={isHost ? "Delete group" : "Leave group"}
        danger
        pending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
