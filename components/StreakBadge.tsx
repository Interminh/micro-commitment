export function StreakBadge({ current }: { current: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={`font-mono text-base font-semibold tabular-nums ${
          current > 0 ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {current}
      </span>
      <span className="text-xs text-muted-foreground">
        {current === 1 ? "day" : "days"}
      </span>
    </span>
  );
}
