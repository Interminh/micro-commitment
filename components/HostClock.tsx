"use client";

import { useEffect, useState } from "react";

export function HostClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set immediately (rather than waiting for the first interval tick) so
    // the clock doesn't sit blank for a second after mount — this is a
    // client-only value the server can't render, not state we could derive
    // without an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Skip the first render so the server-rendered markup (which has no
  // access to the viewer's clock) never mismatches the client.
  if (!now) return null;

  const formatted = now.toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="host-glass-chip fixed bottom-4 left-4 z-40 rounded-xl px-3.5 py-2.5">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        Host time
      </p>
      <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
        {formatted}
      </p>
    </div>
  );
}
