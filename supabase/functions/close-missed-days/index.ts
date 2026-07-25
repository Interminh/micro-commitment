// Daily cron job (spec 5.3): for every active commitment with no check-in
// for "today" in its own local sense, insert a `missed` check-in. Runs with
// the service role key so it bypasses RLS. This is the only writer allowed
// to record a miss on a user's behalf.
//
// Deploy: supabase functions deploy close-missed-days
// Schedule: supabase functions schedule close-missed-days --cron "0 0 * * *"
// (adjust cron expression/timezone once a single-timezone assumption stops
// being good enough for the user base)

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10);
  const weekday = new Date().getUTCDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = weekday === 0 || weekday === 6;

  const { data: commitments, error: commitmentsError } = await supabase
    .from("commitments")
    .select("id, schedule")
    .eq("active", true);

  if (commitmentsError) {
    return Response.json({ error: commitmentsError.message }, { status: 500 });
  }

  const due = (commitments ?? []).filter(
    (c) => c.schedule === "daily" || !isWeekend,
  );

  if (due.length === 0) {
    return Response.json({ closed: 0 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("check_ins")
    .select("commitment_id")
    .eq("date", today)
    .in("commitment_id", due.map((c) => c.id));

  if (existingError) {
    return Response.json({ error: existingError.message }, { status: 500 });
  }

  const alreadyChecked = new Set((existing ?? []).map((r) => r.commitment_id));
  const toClose = due.filter((c) => !alreadyChecked.has(c.id));

  if (toClose.length === 0) {
    return Response.json({ closed: 0 });
  }

  const { error: insertError } = await supabase.from("check_ins").insert(
    toClose.map((c) => ({
      commitment_id: c.id,
      date: today,
      status: "missed",
      submitted_at: new Date().toISOString(),
    })),
  );

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  return Response.json({ closed: toClose.length });
});
