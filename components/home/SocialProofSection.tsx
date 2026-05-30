"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Social proof section.
 * UGC_PHOTOS: real customer photos — drop files into /public/ugc/ and list them here.
 * When photos exist, shows the real grid. Falls back to placeholder squares + email capture.
 */

// ── Real customer photos ──────────────────────────────────────
// Place photos in C:\Dev\hooddshop\public\ugc\ named exactly as below.
// Supported formats: .jpg .jpeg .webp .png
const UGC_PHOTOS = [
  {
    src: "/ugc/canada.jpg.jpeg",
    alt: "Canada hood cover on a Mazda CX-9 — @hooddshopnow",
    nation: "CANADA",
  },
  {
    src: "/ugc/france.jpg.jpeg",
    alt: "France hood cover on a Honda — @hooddshopnow",
    nation: "FRANCE",
  },
  {
    src: "/ugc/bosnia.jpg.jpeg",
    alt: "Bosnia hood cover on a Mazda CX-9 — @hooddshopnow",
    nation: "BOSNIA",
  },
];

// ── Email signup ──────────────────────────────────────────────
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
      <p className="text-white mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", letterSpacing: "0.03em" }}>
        GET EARLY ACCESS
      </p>
      <p className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#999999" }}>
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
            style={{ background: "#0A0A0A", border: "1px solid #2A2A2A", fontFamily: "var(--font-body)" }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2 transition-opacity disabled:opacity-60"
            style={{
              background: "#FF4D00", color: "#000", fontFamily: "var(--font-display)",
              fontSize: "1rem", letterSpacing: "0.06em", borderRadius: "2px",
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

interface ReviewProps { reviews?: { id: string; author: string; body: string; rating: number }[] }

export default function SocialProofSection({ reviews = [] }: ReviewProps) {
  return (
    <section className="py-12 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">

        {reviews.length > 0 ? (
          <>
            <h2 className="text-white mb-8" style={{ fontFamily: "var(--font-display)", fontSize: "32px", letterSpacing: "0.02em" }}>
              WHAT PEOPLE ARE SAYING
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded" style={{ background: "#141414", border: "1px solid #2A2A2A" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#999999", lineHeight: 1.6 }}>{r.body}</p>
                  <p className="mt-3" style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>— {r.author}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: real UGC photos or placeholders */}
            <div>
              <h2 className="text-white mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "32px", letterSpacing: "0.02em", lineHeight: 1 }}>
                JOIN THE MOVEMENT
              </h2>
              <p className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#999999" }}>
                Tag your ride{" "}
                <a href="https://www.instagram.com/hooddshopnow" target="_blank" rel="noopener noreferrer" style={{ color: "#FF4D00" }}>
                  @hooddshopnow
                </a>{" "}
                — best photos featured here.
              </p>

              {/* Real customer photo grid */}
              <div className="grid grid-cols-3 gap-2">
                {UGC_PHOTOS.map((photo, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded"
                    style={{ aspectRatio: "1/1", background: "#141414" }}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 30vw, 15vw"
                      loading="lazy"
                    />
                    {/* Nation label */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", color: "#fff", letterSpacing: "0.1em" }}>
                        {photo.nation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

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

            {/* Right: email capture */}
            <EmailSignup />
          </div>
        )}
      </div>
    </section>
  );
}
