"use client";

import { useState, useTransition } from "react";
import { kickMember } from "@/lib/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function KickMemberButton({
  groupId,
  memberId,
  memberName,
}: {
  groupId: string;
  memberId: string;
  memberName: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await kickMember(groupId, memberId);
      if (result.error) {
        setError(result.error);
      }
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        title={`Remove ${memberName}`}
        className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-danger"
      >
        Kick
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title={`Remove ${memberName}?`}
        description={`They'll lose access to this group and their goals in it. They can rejoin later with an invite link, unless joining is locked.`}
        confirmLabel="Remove"
        danger
        pending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
