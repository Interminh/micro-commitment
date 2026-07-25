export type DailyLogStatus = "done" | "missed";
export type UiStatus = DailyLogStatus | "pending" | "not_due";
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
  timezone: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  active_days: number[];
  archived: boolean;
  current_streak: number;
  longest_streak: number;
  created_at: string;
}

export interface DailyLog {
  id: string;
  goal_id: string;
  date: string;
  status: DailyLogStatus;
  completed_at: string | null;
}

export interface DayCell {
  date: string;
  completed: number;
  scheduled: number;
}
