"use client";

import { useEffect, useState } from "react";

const CAL_PATTERN: Array<"success" | "danger" | null> = [
  "success", "success", "danger", null,
  "success", "success", "success", "danger",
  null, "success", "success", null,
  "success", "success", "danger", "success",
];

function ConvergeDotsIllustration() {
  return (
    <>
      <div className="il-dot" style={{ "--dx": "-11px", "--dy": "-6px" } as React.CSSProperties} />
      <div className="il-dot" style={{ "--dx": "11px", "--dy": "-6px" } as React.CSSProperties} />
      <div className="il-dot" style={{ "--dx": "0px", "--dy": "8px" } as React.CSSProperties} />
    </>
  );
}

function InviteLinkIllustration() {
  return (
    <>
      <span className="il-link-chip">/join/7K3QX</span>
      <span className="il-copied">Copied</span>
    </>
  );
}

function WeekdayPickerIllustration() {
  const days = [
    { label: "S", on: false },
    { label: "M", on: true },
    { label: "T", on: false },
    { label: "W", on: true },
    { label: "T", on: false },
    { label: "F", on: true },
    { label: "S", on: false },
  ];
  return (
    <div className="il-days">
      {days.map((d, i) => (
        <span key={i} className={`il-day ${d.on ? "on" : ""}`}>
          {d.label}
        </span>
      ))}
    </div>
  );
}

function CheckInIllustration() {
  return (
    <div className="il-log-demo">
      <div className="il-log-buttons">
        <span className="il-mini-btn done">Done</span>
        <span className="il-mini-btn miss">Missed</span>
      </div>
      <div className="il-log-result">
        <span className="il-badge-result">Done today</span>
        <span className="il-undo-mini">Undo</span>
      </div>
      <div className="il-cursor il-log-cursor" />
    </div>
  );
}

function StreakIllustration() {
  return (
    <>
      <span className="il-flame">🔥</span>
      <span className="il-streak">12</span>
      <span className="il-streak-label">days</span>
    </>
  );
}

function CalendarIllustration() {
  return (
    <div className="il-grid">
      {CAL_PATTERN.map((color, i) => (
        <div
          key={i}
          className="il-cell"
          style={{
            "--cell-color": color ? `var(--color-${color})` : "transparent",
            animationDelay: `${i * 0.06}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function LockToggleIllustration() {
  return (
    <div className="il-lock-demo">
      <div className="il-lock-track">
        <div className="il-lock-knob" />
      </div>
      <div className="il-cursor il-lock-cursor" />
    </div>
  );
}

function LeaveIllustration() {
  return (
    <>
      <div className="il-door" />
      <span className="il-arrow">→</span>
    </>
  );
}

const steps = [
  {
    title: "Start a group",
    body: "Name it and set a timezone. The timezone controls when the day resets.",
    Illustration: ConvergeDotsIllustration,
  },
  {
    title: "Bring people in",
    body: "Copy the invite link from the group page. Anyone signed in who opens it joins right away.",
    Illustration: InviteLinkIllustration,
  },
  {
    title: "Set what you're doing",
    body: "One goal, a few words, the days it's due. Add more goals whenever.",
    Illustration: WeekdayPickerIllustration,
  },
  {
    title: "Check in daily",
    body: "Done or Missed, one click either way. Wrong click? Undo is right there.",
    Illustration: CheckInIllustration,
  },
  {
    title: "Watch the streak",
    body: "Done days stack up on their own. One miss on a due day and it's back to zero.",
    Illustration: StreakIllustration,
  },
  {
    title: "Check the calendars",
    body: "Group and personal views shade by completion rate. Your own per-goal one is just green, red, or blank, and it's the only one nobody else can see.",
    Illustration: CalendarIllustration,
  },
];

const reference = [
  {
    title: "Lock joining",
    body: "Host-only. Freezes the invite link without touching anyone already in.",
    Illustration: LockToggleIllustration,
  },
  {
    title: "Leave or delete",
    body: "Anyone can leave. Only the host can delete, and that takes the group down for everyone.",
    Illustration: LeaveIllustration,
  },
];

export function HelpGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="help-glass-btn fixed bottom-4 right-4 z-40 cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium text-foreground"
      >
        Need help?
      </button>

      <div
        className={`warp-scrim fixed inset-0 z-50 ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`warp-panel fixed inset-[4vh_4vw] z-50 overflow-hidden rounded-[28px] ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Help guide"
        inert={!open}
      >
        <div className="warp-panel-inner absolute inset-0 flex flex-col">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-7 py-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Guide</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                How Micro-Commitment works, start to finish.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close guide"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-7 pt-2 pb-8">
            <div className="mt-5">
              <p className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Getting started
              </p>
              <div className="guide-sequence">
                {steps.map((step, i) => (
                  <div key={step.title} className="relative grid grid-cols-[32px_1fr_auto] items-center gap-4 py-3">
                    <div className="z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-brand">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                      <p className="mt-0.5 max-w-[46ch] text-xs leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                    <div className="relative flex h-13 w-27 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-background/60">
                      <step.Illustration />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Anytime
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {reference.map((item) => (
                  <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
                    <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-background/60">
                      <item.Illustration />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold">{item.title}</h3>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
