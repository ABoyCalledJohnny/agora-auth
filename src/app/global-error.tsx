/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center justify-center pb-20 text-center">
          <p className="text-8xl font-bold text-neutral-200">500</p>
          <h2 className="mt-4 text-xl font-semibold text-neutral-800">Something went wrong</h2>
          <p className="mt-2 text-sm text-neutral-500">An unexpected error occurred. Please try again later.</p>
          <div className="mt-6 flex gap-4">
            <button onClick={() => reset()} className="link-accent cursor-pointer text-sm font-medium">
              Try again
            </button>
            <a href="/" className="link-accent text-sm font-medium">
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
