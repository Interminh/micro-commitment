// Missed-day cron: for every group, find "yesterday" in that group's own
// timezone, then for every non-archived goal scheduled that weekday with no
// daily_logs row yet, insert one with status='missed'. That insert fires
// the same streak-reset trigger used for a normal check-in, so no separate
// streak recompute step is needed here.
//
// There's no "pending" row to pre-seed: the UI computes pending for today
// on the fly, so this function's only job is closing out yesterday.
//
// Runs with the service role key so it bypasses RLS. This is the only
// writer allowed to record a miss on a user's behalf.
//
// Deploy: supabase functions deploy close-missed-days
// Schedule hourly (idempotent and cheap), so each group's local midnight
// gets picked up within the hour without per-timezone cron scheduling:
//   supabase functions schedule close-missed-days --cron "0 * * * *"

import { createClient } from "jsr:@supabase/supabase-js@2";

function dateInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, timezone");

  if (groupsError) {
    return Response.json({ error: groupsError.message }, { status: 500 });
  }

  const now = new Date();
  const yesterdayInstant = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let closed = 0;

  for (const group of groups ?? []) {
    const yesterday = dateInTimezone(yesterdayInstant, group.timezone);
    const weekday = weekdayOf(yesterday);

    const { data: goals, error: goalsError } = await supabase
      .from("goals")
      .select("id, active_days")
      .eq("group_id", group.id)
      .eq("archived", false);

    if (goalsError) {
      return Response.json({ error: goalsError.message }, { status: 500 });
    }

    const due = (goals ?? []).filter((g) => (g.active_days as number[]).includes(weekday));
    if (due.length === 0) continue;

    const { data: existing, error: existingError } = await supabase
      .from("daily_logs")
      .select("goal_id")
      .eq("date", yesterday)
      .in("goal_id", due.map((g) => g.id));

    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }

    const alreadyLogged = new Set((existing ?? []).map((r) => r.goal_id));
    const toClose = due.filter((g) => !alreadyLogged.has(g.id));
    if (toClose.length === 0) continue;

    const { error: insertError } = await supabase.from("daily_logs").insert(
      toClose.map((g) => ({
        goal_id: g.id,
        date: yesterday,
        status: "missed",
      })),
    );

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    closed += toClose.length;
  }

  return Response.json({ closed });
});
