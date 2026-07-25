import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle, signOut } from "@/lib/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthDomainNote } from "@/components/AuthDomainNote";
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
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
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
          <button
            type="submit"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>
      </div>
      <AuthDomainNote />
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        opacity=".9"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity=".7"
      />
      <path
        fill="currentColor"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
