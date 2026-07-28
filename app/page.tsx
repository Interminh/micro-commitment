import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle, signOut } from "@/lib/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthDomainNote } from "@/components/AuthDomainNote";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { LeaveOrDeleteGroupButton } from "@/components/LeaveOrDeleteGroupButton";
import { firstNameOf } from "@/lib/user";
import type { MemberRole } from "@/lib/types";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, role, groups(id, name)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true });

    const groups = (memberships ?? [])
      .map((m) => {
        const group = m.groups as unknown as { id: string; name: string } | null;
        return group ? { ...group, role: m.role as MemberRole } : null;
      })
      .filter((g): g is { id: string; name: string; role: MemberRole } => g !== null);

    if (groups.length === 0) {
      redirect("/onboarding");
    }

    const firstName = firstNameOf(user);

    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-12 pb-24">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {firstName ? `${firstName}'s Groups` : "Your Groups"}
          </h1>
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

        <ul className="mt-6 flex flex-col gap-2">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <Link
                href={`/group/${group.id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand"
              >
                {group.name}
                {group.role === "organizer" && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (host)
                  </span>
                )}
              </Link>
              <LeaveOrDeleteGroupButton
                groupId={group.id}
                groupName={group.name}
                isHost={group.role === "organizer"}
              />
            </li>
          ))}
        </ul>

        <Link
          href="/onboarding"
          className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
        >
          + Start or join another group
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Micro-Commitment
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
          Commit publicly. <span className="text-danger">Fail publicly.</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground text-balance">
          Set one small daily commitment. Your friend group sees every
          check-in, and every miss.
        </p>

        {error && (
          <p className="mt-6 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
            Sign-in failed. Please try again.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signInWithGoogle();
          }}
          className="mt-8"
        >
          <GoogleSignInButton />
        </form>
      </div>
      <AuthDomainNote />
    </main>
  );
}
