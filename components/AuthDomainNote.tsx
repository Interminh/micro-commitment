"use client";

import { useState } from "react";

export function AuthDomainNote() {
  const [open, setOpen] = useState(true);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div
          role="tooltip"
          className="absolute bottom-[44px] left-0 w-80 rounded-lg border border-border bg-surface p-[15px] text-[15px] leading-snug text-muted-foreground shadow-lg"
        >
          You might notice a long <span className="font-mono">supabase.co</span>{" "}
          address flash by during Google sign-in. That&apos;s normal, it&apos;s
          our auth provider&apos;s free-tier domain. We&apos;ll move this to
          our own domain in a later version.
        </div>
      )}
      <button
        type="button"
        aria-label="Why does sign-in show a supabase.co address?"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true">
          <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10" y1="9" x2="10" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="6" r="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
