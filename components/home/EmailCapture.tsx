"use client";

import { useState } from "react";

interface EmailCaptureProps {
  headline: string;
  description: string;
  source: string;
  buttonText?: string;
  compact?: boolean;
}

export default function EmailCapture({
  headline,
  description,
  source,
  buttonText = "Notify Me",
  compact = false,
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className={compact ? "" : "text-center"}>
        {!compact && <h3 className="text-display-sm text-white mb-2">{headline}</h3>}
        <div className="flex items-center gap-2 justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <p className="text-body-sm" style={{ color: "#22C55E" }}>
            You&apos;re in! We&apos;ll keep you posted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "text-center"}>
      {!compact && (
        <>
          <h3 className="text-display-md text-white">{headline}</h3>
          <p className="text-body-sm mt-2 max-w-md mx-auto" style={{ color: "#888" }}>
            {description}
          </p>
        </>
      )}
      {compact && (
        <p className="text-body-sm mb-2" style={{ color: "#888" }}>
          {description}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col sm:flex-row gap-2 ${compact ? "mt-2" : "mt-5 max-w-md mx-auto"}`}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 rounded text-white text-body-sm placeholder:text-[#555] outline-none transition-colors focus:ring-1"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            minHeight: "48px",
          }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 text-white font-semibold text-[13px] tracking-[0.08em] uppercase rounded transition-all touch-active disabled:opacity-50 whitespace-nowrap"
          style={{
            background: "var(--color-accent)",
            minHeight: "48px",
          }}
        >
          {status === "loading" ? "..." : buttonText}
        </button>
      </form>

      {status === "error" && (
        <p className="text-body-xs mt-2" style={{ color: "var(--color-error)" }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
