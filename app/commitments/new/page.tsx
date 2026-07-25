import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateCommitmentForm } from "@/components/CreateCommitmentForm";

export default async function NewCommitmentPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  if (!groupId) redirect("/onboarding");

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, groups(name)")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const groupName = (membership as unknown as { groups: { name: string } | null }).groups?.name;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Step 2 of 2
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Set your commitment{groupName ? ` in ${groupName}` : ""}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Keep it small and concrete: one clear yes/no action per day.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <CreateCommitmentForm groupId={groupId} />
      </div>
    </main>
  );
}
