import type { User } from "@supabase/supabase-js";

export function firstNameOf(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const givenName = typeof meta.given_name === "string" ? meta.given_name : null;
  if (givenName) return givenName;

  const fullName =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;
  if (fullName) return fullName.trim().split(/\s+/)[0];

  return null;
}
