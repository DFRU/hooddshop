"use client";

import { useState, useEffect } from "react";

// Order cutoff to guarantee delivery before the June 11 opener
// 7-day minimum production + 3-day buffer = June 1 cutoff
// Extend to June 4 for expedited suppliers
const ORDER_CUTOFF = new Date("2026-06-04T23:59:59-04:00"); // EDT
const TOURNAMENT_START = new Date("2026-06-11T17:00:00Z");   // UTC kickoff

function calcSecondsLeft(target: Date): number {
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return "";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const [secsLeft, setSecsLeft] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSecsLeft(calcSecondsLeft(ORDER_CUTOFF));
    const id = setInterval(() => setSecsLeft(calcSecondsLeft(ORDER_CUTOFF)), 1000);
    return () => clearInterval(id);
  }, []);

  // Don't render after cutoff passes or after dismissal
  if (!mounted || dismissed) return null;
  if (Date.now() > ORDER_CUTOFF.getTime()) return null;

  const countdown = formatCountdown(secsLeft);

  return (
    <div
      className="relative flex items-center justify-center px-8 py-2.5 text-center"
      style={{
        background: "#FF4D00",
        minHeight: "40px",
      }}
      role="banner"
    >
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          fontWeight: 600,
          color: "#000000",
          lineHeight: 1.4,
        }}
      >
        ⚡ Order by June 4 — guaranteed delivery before the June 11 opener
        {countdown && (
          <span
            className="ml-2 px-2 py-0.5 rounded font-bold"
            style={{
              background: "rgba(0,0,0,0.15)",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.04em",
            }}
          >
            {countdown} left
          </span>
        )}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
