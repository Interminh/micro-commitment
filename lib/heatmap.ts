import type { Goal, DailyLog, DayCell } from "./types";

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

export function buildPersonCells(
  dates: string[],
  userGoals: Pick<Goal, "id" | "active_days" | "created_at">[],
  logsByGoalAndDate: Map<string, DailyLog>,
): DayCell[] {
  return dates.map((date) => {
    const weekday = weekdayOf(date);
    let scheduled = 0;
    let completed = 0;
    for (const goal of userGoals) {
      if (toDateOnly(goal.created_at) > date) continue;
      if (!goal.active_days.includes(weekday)) continue;
      scheduled += 1;
      if (logsByGoalAndDate.get(`${goal.id}:${date}`)?.status === "done") completed += 1;
    }
    return { date, completed, scheduled };
  });
}

// Pads a (possibly partial or empty) set of cells out to every day of the
// given calendar year, so the grid always renders Jan-Dec like GitHub's
// contribution calendar regardless of how much real history exists.
export function fillYear(cells: DayCell[], year: number): DayCell[] {
  const byDate = new Map(cells.map((c) => [c.date, c]));
  return dateRange(`${year}-01-01`, `${year}-12-31`).map(
    (date) => byDate.get(date) ?? { date, completed: 0, scheduled: 0 },
  );
}

export function aggregateCells(perPerson: DayCell[][]): DayCell[] {
  if (perPerson.length === 0 || perPerson[0].length === 0) return [];
  return perPerson[0].map((_, i) => {
    const date = perPerson[0][i].date;
    let completed = 0;
    let scheduled = 0;
    for (const cells of perPerson) {
      completed += cells[i].completed;
      scheduled += cells[i].scheduled;
    }
    return { date, completed, scheduled };
  });
}
