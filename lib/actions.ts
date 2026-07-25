"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Schedule } from "@/lib/types";

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
  const origin = (await headers()).get("origin");
  const callback = new URL("/auth/callback", origin ?? undefined);
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

export async function createCommitment(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const label = String(formData.get("label") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "daily") as Schedule;
  const groupId = String(formData.get("groupId") ?? "");

  if (!label) return { error: "Give your commitment a short label." };
  if (!groupId) return { error: "Missing group." };

  const { error } = await supabase.from("commitments").insert({
    user_id: user.id,
    group_id: groupId,
    label,
    schedule,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have an active commitment in this group." };
    }
    return { error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  redirect(`/group/${groupId}`);
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

  const inviteCode = randomInviteCode();

  const { data: authCheck } = await supabase.rpc("debug_auth_uid" as never);
  console.log("[createGroup] user.id =", user.id, "auth.uid() =", authCheck);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select()
    .single();

  if (groupError || !group) {
    console.log("[createGroup] insert error =", JSON.stringify(groupError, null, 2));
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

  redirect(`/commitments/new?groupId=${group.id}`);
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

  // 23505 = already a member (rejoining via the link) — they likely already
  // have a commitment, so go straight to the group instead of re-prompting.
  if (memberError?.code === "23505") {
    redirect(`/group/${group.id}`);
  }

  redirect(`/commitments/new?groupId=${group.id}`);
}

export async function submitCheckIn(commitmentId: string, groupId: string, status: "done" | "missed") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("check_ins").insert({
    commitment_id: commitmentId,
    date: today,
    status,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Already checked in today." };
    }
    return { error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  return { error: null };
}
