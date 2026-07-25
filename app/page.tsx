import { createClient } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/lib/actions";
import { redirect } from "next/navigation";

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
    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    redirect(membership ? `/group/${membership.group_id}` : "/onboarding");
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
          check-in — and every miss.
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
