"use client";

import { useActionState } from "react";
import { createCommitment } from "@/lib/actions";

export function CreateCommitmentForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(createCommitment, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="groupId" value={groupId} />
      <div>
        <label htmlFor="label" className="text-sm font-medium">
          What are you committing to, daily?
        </label>
        <input
          id="label"
          name="label"
          required
          maxLength={80}
          placeholder="e.g. Study 20 minutes"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Schedule</legend>
        <div className="mt-1.5 flex gap-2">
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:checked]:text-brand">
            <input type="radio" name="schedule" value="daily" defaultChecked className="sr-only" />
            Every day
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:checked]:text-brand">
            <input type="radio" name="schedule" value="weekdays" className="sr-only" />
            Weekdays only
          </label>
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set commitment"}
      </button>
    </form>
  );
}
