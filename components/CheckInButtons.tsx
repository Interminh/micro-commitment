"use client";

import { useState, useTransition } from "react";
import { submitCheckIn } from "@/lib/actions";
import type { CheckInStatus } from "@/lib/types";

export function CheckInButtons({
  commitmentId,
  groupId,
  initialStatus,
}: {
  commitmentId: string;
  groupId: string;
  initialStatus: CheckInStatus | null;
}) {
  const [status, setStatus] = useState<CheckInStatus | null>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(next: "done" | "missed") {
    setError(null);
    startTransition(async () => {
      const result = await submitCheckIn(commitmentId, groupId, next);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus(next);
      }
    });
  }

  if (status === "done" || status === "missed") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          status === "done"
            ? "bg-success-bg text-success"
            : "bg-danger-bg text-danger"
        }`}
      >
        {status === "done" ? "Done today" : "Missed"}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit("done")}
          disabled={isPending}
          className="cursor-pointer rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => submit("missed")}
          disabled={isPending}
          className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
        >
          Missed
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
