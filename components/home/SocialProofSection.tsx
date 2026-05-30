"use client";

import { useState } from "react";

/**
 * Social proof section.
 * Zero-review state: compact UGC call-to-action + email capture.
 * Reviews prop: if passed, renders real review grid instead.
 *
 * Future: pass reviews prop when review engine is live.
 */

interface Review {
  id: string;
  author: string;
  body: string;
  rating: number;
}

interface Props {
  reviews?: Review[];
}

function ReviewGrid({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="p-4 rounded"
          style={{ background: "#141414", border: "1px solid #2A2A2A" }}
        >
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#999999", lineHeight: 1.6 }}>
            {r.body}
          </p>
          <p className="mt-3" style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>
            — {r.author}
          </p>
        </div>
      ))}
    </div>
  );
}

function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className="rounded p-6 lg:p-8"
      style={{ background: "#141414", border: "1px solid #1E1E1E" }}
    >
      <p
        className="text-white mb-1"
        style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.03em" }}
      >
        GET EARLY ACCESS
      </p>
      <p
        className="mb-4"
        style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#999999" }}
      >
        New nation drops, flash deals, and World Cup match-day offers. No spam.
      </p>

      {status === "done" ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#22C55E" }}>
          ✓ You&apos;re in — first to know when deals drop.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded px-3 py-2 text-white outline-none text-sm"
            style={{
              background: "#0A0A0A",
              border: "1px solid #2A2A2A",
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2 font-semibold text-sm rounded transition-opacity disabled:opacity-60"
            style={{
              background: "#FF4D00",
              color: "#000",
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              letterSpacing: "0.06em",
              borderRadius: "2px",
            }}
          >
            {status === "loading" ? "..." : "JOIN"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2" style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#EF4444" }}>
          Something went wrong — try again.
        </p>
      )}
    </div>
  );
}

function UGCPlaceholder() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded"
          style={{ aspectRatio: "1/1", border: "1px dashed #1E1E1E" }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#2A2A2A" }}>
            Your photo
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SocialProofSection({ reviews = [] }: Props) {
  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">

        {reviews.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="text-white" style={{ fontFamily: "var(--font-display)", fontSize: "32px", letterSpacing: "0.02em" }}>
                WHAT PEOPLE ARE SAYING
              </h2>
            </div>
            <ReviewGrid reviews={reviews} />
          </>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: UGC call to action */}
            <div>
              <h2
                className="text-white mb-1"
                style={{ fontFamily: "var(--font-display)", fontSize: "32px", letterSpacing: "0.02em", lineHeight: 1 }}
              >
                JOIN THE MOVEMENT
              </h2>
              <p
                className="mb-4"
                style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#999999" }}
              >
                Tag your ride{" "}
                <a
                  href="https://www.instagram.com/hooddshopnow"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#FF4D00" }}
                >
                  @hooddshopnow
                </a>{" "}
                — best photos featured here.
              </p>

              {/* Compact placeholder grid */}
              <UGCPlaceholder />

              <a
                href="https://www.instagram.com/hooddshopnow"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 touch-active"
                style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#FF4D00" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Follow @hooddshopnow on Instagram
              </a>
            </div>

            {/* Right: Email capture */}
            <EmailSignup />
          </div>
        )}
      </div>
    </section>
  );
}
