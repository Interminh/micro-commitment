import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "@/lib/actions";
import { AuthDomainNote } from "@/components/AuthDomainNote";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { GoogleAuroraBackdrop } from "@/components/GoogleAuroraBackdrop";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  const { data: matches } = await supabase.rpc("get_group_by_invite_code", {
    code: inviteCode.toUpperCase(),
  });
  const group = matches?.[0];

  if (!group) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold">Invite link not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite code doesn&apos;t match an active group. Ask whoever
          shared it to send a fresh link.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
        <GoogleAuroraBackdrop />
        <p className="relative text-sm font-medium tracking-wide text-muted-foreground uppercase">
          You&apos;re invited
        </p>
        <h1 className="relative mt-2 text-2xl font-semibold tracking-tight">
          {group.name}
        </h1>
        <p className="relative mt-3 text-sm text-muted-foreground">
          Sign in to join and set your daily commitment.
        </p>
        <form
          action={async () => {
            "use server";
            await signInWithGoogle(`/join/${inviteCode}`);
          }}
          className="relative mt-6 w-full"
        >
          <GoogleSignInButton />
        </form>
        <AuthDomainNote />
      </main>
    );
  }

  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership) {
    redirect(`/group/${group.id}`);
  }

  if (group.joining_locked) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          You&apos;re invited
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {group.name}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This group isn&apos;t accepting new members right now. Ask the
          host to unlock joining and try again.
        </p>
      </main>
    );
  }

  const { error: joinError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  });

  if (joinError && joinError.code !== "23505") {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-danger">
          Couldn&apos;t join this group: {joinError.message}
        </p>
      </main>
    );
  }

  redirect(`/goals/new?groupId=${group.id}`);
}
