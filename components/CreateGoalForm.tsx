"use client";

import { useActionState, useState } from "react";
import { createGoal } from "@/lib/actions";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function CreateGoalForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(createGoal, undefined);
  const [activeDays, setActiveDays] = useState<number[]>(ALL_DAYS);

  function toggleDay(day: number) {
    setActiveDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort(),
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="activeDays" value={JSON.stringify(activeDays)} />

      <div>
        <label htmlFor="name" className="text-sm font-medium">
          What are you committing to?
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="e.g. Study 20 minutes"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Which days?</legend>
        <div className="mt-1.5 flex gap-1.5">
          {DAY_LABELS.map((label, day) => {
            const selected = activeDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                aria-label={
                  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]
                }
                onClick={() => toggleDay(day)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  selected
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {activeDays.length === 0 && (
          <p className="mt-1.5 text-xs text-danger">Pick at least one day.</p>
        )}
      </fieldset>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || activeDays.length === 0}
        className="cursor-pointer rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add goal"}
      </button>
    </form>
  );
}
