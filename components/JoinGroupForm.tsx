"use client";

import { useActionState } from "react";
import { joinGroupByCode } from "@/lib/actions";

export function JoinGroupForm() {
  const [state, action, pending] = useActionState(joinGroupByCode, undefined);

  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <input
        name="code"
        required
        placeholder="e.g. 7K3QXPD"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm uppercase tracking-wider outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join group"}
      </button>
    </form>
  );
}
