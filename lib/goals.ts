import type { DailyLogStatus, UiStatus } from "./types";

export function isDueOn(activeDays: number[], weekday: number): boolean {
  return activeDays.includes(weekday);
}

export function computeUiStatus(isDue: boolean, loggedStatus: DailyLogStatus | null): UiStatus {
  if (loggedStatus) return loggedStatus;
  return isDue ? "pending" : "not_due";
}
