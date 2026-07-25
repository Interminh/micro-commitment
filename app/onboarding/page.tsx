import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { JoinGroupForm } from "@/components/JoinGroupForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { count: groupCount } = await supabase
    .from("group_members")
    .select("group_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasGroups = (groupCount ?? 0) > 0;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      {hasGroups ? (
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          ← Back to your groups
        </Link>
      ) : (
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Step 1 of 2
        </p>
      )}
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {hasGroups ? "Start or join another group" : "Start or join a group"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;ll set your daily commitment once you&apos;re in a group —
        that&apos;s who sees it.
      </p>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Create a new group</h2>
        <CreateGroupForm />
      </section>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Join with an invite code</h2>
        <JoinGroupForm />
      </section>
    </main>
  );
}
