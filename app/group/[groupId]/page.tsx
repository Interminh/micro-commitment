import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBaseUrl } from "@/lib/site-url";
import { signOut } from "@/lib/actions";
import { MemberRow, type MemberGoal } from "@/components/MemberRow";
import { GroupHeatmap } from "@/components/GroupHeatmap";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { GroupJoinLockToggle } from "@/components/GroupJoinLockToggle";
import { HostClock } from "@/components/HostClock";
import { isDueOn } from "@/lib/goals";
import { dateRange, buildPersonCells, aggregateCells } from "@/lib/heatmap";
import type { Goal, DailyLog, DailyLogStatus } from "@/lib/types";

const MAX_HISTORY_DAYS = 365;

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, joining_locked, timezone")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          This group doesn&apos;t exist, or you&apos;re not a member of it.
        </p>
      </main>
    );
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("role, joined_at, profiles(id, name, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  const { data: goals } = await supabase
    .from("goals")
    .select("id, user_id, name, active_days, current_streak, created_at")
    .eq("group_id", groupId)
    .eq("archived", false);

  const allGoals = (goals ?? []) as Pick<
    Goal,
    "id" | "user_id" | "name" | "active_days" | "current_streak" | "created_at"
  >[];

  const today = new Date().toISOString().slice(0, 10);
  const todayWeekday = new Date().getDay();

  const earliestGoalDate =
    allGoals.length > 0
      ? allGoals.reduce((min, g) => (g.created_at < min ? g.created_at : min), allGoals[0].created_at).slice(0, 10)
      : today;
  const fullRange = dateRange(earliestGoalDate, today);
  const cappedStart =
    fullRange.length > MAX_HISTORY_DAYS ? fullRange[fullRange.length - MAX_HISTORY_DAYS] : earliestGoalDate;
  const dates = allGoals.length > 0 ? dateRange(cappedStart, today) : [];

  const goalIds = allGoals.map((g) => g.id);
  const { data: logs } =
    goalIds.length > 0
      ? await supabase
          .from("daily_logs")
          .select("id, goal_id, date, status, completed_at")
          .in("goal_id", goalIds)
          .gte("date", cappedStart)
      : { data: [] };

  const logsByGoalAndDate = new Map<string, DailyLog>(
    (logs ?? []).map((l) => [`${l.goal_id}:${l.date}`, l as DailyLog]),
  );

  const baseUrl = await getBaseUrl();
  const inviteLink = `${baseUrl}/join/${group.invite_code}`;

  const memberEntries = (members ?? [])
    .map((m) => {
      const profile = m.profiles as unknown as {
        id: string;
        name: string | null;
        avatar_url: string | null;
      } | null;
      if (!profile) return null;

      const userGoals = allGoals.filter((g) => g.user_id === profile.id);
      const cells = dates.length > 0 ? buildPersonCells(dates, userGoals, logsByGoalAndDate) : [];
      const isViewerOwned = profile.id === user.id;

      const memberGoals: MemberGoal[] = userGoals.map((g) => ({
        id: g.id,
        name: g.name,
        currentStreak: g.current_streak,
        dueToday: isDueOn(g.active_days, todayWeekday),
        loggedStatus: (logsByGoalAndDate.get(`${g.id}:${today}`)?.status as DailyLogStatus | undefined) ?? null,
        // Per-goal history is only ever computed (and sent to the client)
        // for the signed-in user's own goals — nobody else's payload
        // includes it, so only they can see a goal's individual calendar.
        cells: isViewerOwned && dates.length > 0 ? buildPersonCells(dates, [g], logsByGoalAndDate) : undefined,
      }));

      return { profile, cells, memberGoals };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const groupCells = aggregateCells(memberEntries.map((m) => m.cells));

  const missedToday = memberEntries.reduce(
    (count, m) => count + m.memberGoals.filter((g) => g.loggedStatus === "missed").length,
    0,
  );

  const currentUserHasGoals = memberEntries.some(
    (m) => m.profile.id === user.id && m.memberGoals.length > 0,
  );

  const isOrganizer = (members ?? []).some(
    (m) => m.role === "organizer" && (m.profiles as unknown as { id: string } | null)?.id === user.id,
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Your groups
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{group.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members?.length ?? 0} member{members?.length === 1 ? "" : "s"}
            {missedToday > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="text-danger">
                  {missedToday} missed today
                </span>
              </>
            )}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="submit"
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>

      {isOrganizer && (
        <div className="mt-6">
          <GroupJoinLockToggle groupId={group.id} initialLocked={group.joining_locked} />
        </div>
      )}

      <div className="mt-6">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Invite friends to this group
        </p>
        {group.joining_locked ? (
          <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">
            Joining is locked, so the invite link won&apos;t work right now.
          </p>
        ) : (
          <InviteLinkCard link={inviteLink} />
        )}
      </div>

      {groupCells.length > 0 && (
        <div className="mt-6">
          <GroupHeatmap cells={groupCells} />
        </div>
      )}

      <ul className="mt-8 flex flex-col gap-2">
        {memberEntries.map(({ profile, cells, memberGoals }) => (
          <MemberRow
            key={profile.id}
            name={profile.name ?? "Someone"}
            avatarUrl={profile.avatar_url}
            isSelf={profile.id === user.id}
            memberId={profile.id}
            groupId={group.id}
            goals={memberGoals}
            heatmapCells={cells}
            canKick={isOrganizer}
          />
        ))}
      </ul>

      <Link
        href={`/goals/new?groupId=${group.id}`}
        className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
      >
        {currentUserHasGoals ? "+ Add another goal" : "Set your first goal in this group →"}
      </Link>

      <HostClock timezone={group.timezone} />
    </main>
  );
}
