"use client";

import { useActionState, useEffect, useRef } from "react";
import { createGroup } from "@/lib/actions";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState(createGroup, undefined);
  const timezoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (timezoneRef.current) {
        timezoneRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    } catch {
      // Stick with UTC if the browser can't tell us its timezone.
    }
  }, []);

  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <input ref={timezoneRef} type="hidden" name="timezone" defaultValue="UTC" />
      <input
        name="name"
        required
        placeholder="e.g. Study Squad"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
