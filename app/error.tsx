"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-[var(--container-px)]">
      <div className="text-center space-y-4">
        <h2 className="text-display-md text-white">Something went wrong</h2>
        <p className="text-body-md" style={{ color: "#888" }}>
          We hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-colors"
          style={{ background: "var(--color-accent)" }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
