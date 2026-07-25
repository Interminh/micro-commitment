"use client";

import { useState } from "react";

export function InviteLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — user can still select and copy manually.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate bg-transparent px-2 text-sm text-muted-foreground outline-none"
        aria-label="Invite link"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 cursor-pointer rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-colors hover:bg-brand-hover"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
