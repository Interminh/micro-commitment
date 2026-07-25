"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/site-url";

function randomInviteCode(): string {
  // Short, URL-safe, unambiguous-enough code for a 5-15 person friend group.
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const callback = new URL("/auth/callback", await getBaseUrl());
  if (next) callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    redirect("/?error=auth_failed");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ActionState = { error: string | null };

export async function createGoal(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  const groupId = String(formData.get("groupId") ?? "");
  let activeDays: number[] = [];
  try {
    activeDays = JSON.parse(String(formData.get("activeDays") ?? "[]"));
  } catch {
    activeDays = [];
  }

  if (!name) return { error: "Give your goal a short name." };
  if (!groupId) return { error: "Missing group." };
  if (!Array.isArray(activeDays) || activeDays.length === 0) {
    return { error: "Pick at least one day." };
  }

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    group_id: groupId,
    name,
    active_days: activeDays,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  redirect(`/group/${groupId}`);
}

export async function archiveGoal(goalId: string, groupId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase
    .from("goals")
    .update({ archived: true })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  return { error: null };
}

export async function createGroup(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give your group a name." };

  const timezone = String(formData.get("timezone") ?? "UTC") || "UTC";
  const inviteCode = randomInviteCode();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, invite_code: inviteCode, created_by: user.id, timezone })
    .select()
    .single();

  if (groupError || !group) {
    return { error: groupError?.message ?? "Could not create group." };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "organizer",
  });

  if (memberError) {
    return { error: memberError.message };
  }

  redirect(`/goals/new?groupId=${group.id}`);
}

export async function joinGroupByCode(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) return { error: "Enter an invite code." };

  const { data: matches, error: lookupError } = await supabase.rpc(
    "get_group_by_invite_code",
    { code },
  );

  const group = matches?.[0];
  if (lookupError || !group) {
    return { error: "That invite code doesn't match a group." };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
  });

  if (memberError && memberError.code !== "23505") {
    return { error: memberError.message };
  }

  // 23505 = already a member (rejoining via the link). They likely already
  // have goals set up, so go straight to the group instead of re-prompting.
  if (memberError?.code === "23505") {
    redirect(`/group/${group.id}`);
  }

  redirect(`/goals/new?groupId=${group.id}`);
}

export async function submitDailyLog(goalId: string, groupId: string, status: "done" | "missed") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("daily_logs").insert({
    goal_id: goalId,
    date: today,
    status,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Already logged today." };
    }
    return { error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  return { error: null };
}

export async function leaveGroup(groupId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null };
}

export async function deleteGroup(groupId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null };
}
