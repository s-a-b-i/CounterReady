"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display h-xl mt-3">Something slipped.</h1>
      <p className="mt-4 text-soft">An unexpected error happened. Your choices are saved in this tab.</p>
      <button className="btn mt-8" onClick={reset}>Try again</button>
    </div>
  );
}
