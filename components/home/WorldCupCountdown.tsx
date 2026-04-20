"use client";

import { useState, useEffect } from "react";

// FIFA World Cup 2026 kicks off June 11, 2026
const WORLD_CUP_START = new Date("2026-06-11T17:00:00Z"); // Opening match UTC

function calcDiff(now: Date) {
  const ms = WORLD_CUP_START.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  return {
    days,
    hours: hours % 24,
    mins: mins % 60,
    secs: secs % 60,
  };
}

export default function WorldCupCountdown() {
  const [diff, setDiff] = useState(() => calcDiff(new Date()));

  useEffect(() => {
    const id = setInterval(() => setDiff(calcDiff(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  const blocks = [
    { val: diff.days, label: "Days" },
    { val: diff.hours, label: "Hrs" },
    { val: diff.mins, label: "Min" },
    { val: diff.secs, label: "Sec" },
  ];

  return (
    <div className="flex items-center gap-3">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-3">
          <div className="text-center">
            <div
              className="text-display-sm text-white tabular-nums px-2.5 py-1.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.05)", minWidth: "44px" }}
            >
              {String(b.val).padStart(2, "0")}
            </div>
            <div className="text-[9px] uppercase tracking-[0.1em] mt-1" style={{ color: "#555" }}>
              {b.label}
            </div>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-display-sm -mt-4" style={{ color: "#333" }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
