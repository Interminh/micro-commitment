// For every group, work out "yesterday" in that group's own timezone, then
// mark any scheduled goal with no log for that date as missed. That insert
// triggers the same streak reset a normal check-in would, so there's
// nothing else to do here.
//
// No pending rows to pre-seed since the UI figures out "pending" on the
// fly, so closing out yesterday is this function's whole job.
//
// Uses the service role key to bypass RLS. It's the only thing allowed to
// record a miss on someone's behalf.
//
// Deploy: supabase functions deploy close-missed-days
// Run it hourly so each group's local midnight gets caught within the
// hour, no per-timezone scheduling needed:
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
