"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        This page hit a snag
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Try again, or head back home and pick up where you left off.
      </p>

      <div className="mt-8 flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Go home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground">Error ref: {error.digest}</p>
      )}
    </main>
  );
}
