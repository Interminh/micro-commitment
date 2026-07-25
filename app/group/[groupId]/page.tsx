import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { signOut } from "@/lib/actions";
import { MemberRow } from "@/components/MemberRow";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import type { CheckInStatus, Schedule } from "@/lib/types";

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
    .select("id, name, invite_code")
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

  const { data: commitments } = await supabase
    .from("commitments")
    .select("id, user_id, label, schedule")
    .eq("group_id", groupId)
    .eq("active", true);

  const commitmentIds = (commitments ?? []).map((c) => c.id);
  const today = new Date().toISOString().slice(0, 10);
  const weekday = new Date().getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  const { data: checkIns } =
    commitmentIds.length > 0
      ? await supabase
          .from("check_ins")
          .select("commitment_id, status")
          .eq("date", today)
          .in("commitment_id", commitmentIds)
      : { data: [] };

  const { data: streaks } =
    commitmentIds.length > 0
      ? await supabase
          .from("streaks")
          .select("commitment_id, current_streak")
          .in("commitment_id", commitmentIds)
      : { data: [] };

  const commitmentByUser = new Map(
    (commitments ?? []).map((c) => [c.user_id, c]),
  );
  const checkInByCommitment = new Map(
    (checkIns ?? []).map((c) => [c.commitment_id, c.status as CheckInStatus]),
  );
  const streakByCommitment = new Map(
    (streaks ?? []).map((s) => [s.commitment_id, s.current_streak]),
  );

  const origin = (await headers()).get("origin") ?? "";
  const inviteLink = `${origin}/join/${group.invite_code}`;

  const missedToday = (members ?? []).filter((m) => {
    const profile = m.profiles as unknown as { id: string } | null;
    const commitment = profile ? commitmentByUser.get(profile.id) : undefined;
    return commitment && checkInByCommitment.get(commitment.id) === "missed";
  }).length;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
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

      <div className="mt-6">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Invite friends to this group
        </p>
        <InviteLinkCard link={inviteLink} />
      </div>

      <ul className="mt-8 flex flex-col gap-2">
        {(members ?? []).map((m) => {
          const profile = m.profiles as unknown as {
            id: string;
            name: string | null;
            avatar_url: string | null;
          } | null;
          if (!profile) return null;

          const commitment = commitmentByUser.get(profile.id);
          const schedule = commitment?.schedule as Schedule | undefined;
          const dueToday = schedule === "weekdays" ? !isWeekend : true;
          const status = commitment
            ? checkInByCommitment.get(commitment.id) ?? null
            : null;
          const streak = commitment
            ? streakByCommitment.get(commitment.id) ?? 0
            : 0;

          return (
            <MemberRow
              key={profile.id}
              name={profile.name ?? "Someone"}
              avatarUrl={profile.avatar_url}
              isSelf={profile.id === user.id}
              commitmentLabel={commitment?.label ?? null}
              commitmentId={commitment?.id ?? null}
              currentStreak={streak}
              todayStatus={status}
              dueToday={dueToday}
              groupId={group.id}
            />
          );
        })}
      </ul>

      {!commitmentByUser.get(user.id) && (
        <a
          href={`/commitments/new?groupId=${group.id}`}
          className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
        >
          Set your commitment in this group →
        </a>
      )}
    </main>
  );
}
