export type Schedule = "daily" | "weekdays";
export type CheckInStatus = "done" | "missed" | "pending";
export type MemberRole = "organizer" | "member";

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  group_id: string;
  label: string;
  schedule: Schedule;
  active: boolean;
  created_at: string;
}

export interface Streak {
  commitment_id: string;
  current_streak: number;
  longest_streak: number;
  last_updated: string;
}

export interface GroupMemberRow {
  profile: Profile;
  role: MemberRole;
  commitment: Commitment | null;
  streak: Streak | null;
  todayStatus: CheckInStatus | null;
}
