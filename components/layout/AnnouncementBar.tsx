"use client";

import { useState, useEffect } from "react";

// World Cup 2026 opener: June 11
const TOURNAMENT_START = new Date("2026-06-11T17:00:00Z");

function getDaysLeft(): number {
  return Math.max(0, Math.ceil((TOURNAMENT_START.getTime() - Date.now()) / 86400000));
}

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDaysLeft(getDaysLeft());
    const id = setInterval(() => setDaysLeft(getDaysLeft()), 60000);
    return () => clearInterval(id);
  }, []);

  // Hide after tournament starts or if dismissed
  if (!mounted || dismissed) return null;
  if (Date.now() > TOURNAMENT_START.getTime()) return null;

  return (
    <div
      className="relative flex items-center justify-center px-8 py-2.5 text-center"
      style={{ background: "#FF4D00", minHeight: "40px" }}
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
        🌍 World Cup 2026{" "}
        {mounted && daysLeft > 0 ? (
          <span
            className="mx-1 px-2 py-0.5 rounded font-bold"
            style={{ background: "rgba(0,0,0,0.15)", fontFamily: "var(--font-display)", letterSpacing: "0.04em" }}
          >
            {daysLeft} days to go
          </span>
        ) : null}
        · Made to order · 10–12 day delivery
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
