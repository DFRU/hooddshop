"use client";

import { useState, useEffect } from "react";
import EmailCapture from "./EmailCapture";

function getNextSunday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const daysUntil = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setDate(next.getDate() + daysUntil);
  next.setHours(20, 0, 0, 0); // 8 PM
  return next;
}

function formatCountdown(ms: number): { days: string; hours: string; mins: string; secs: string } {
  if (ms <= 0) return { days: "0", hours: "0", mins: "0", secs: "0" };
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  return {
    days: String(d),
    hours: String(h % 24).padStart(2, "0"),
    mins: String(m % 60).padStart(2, "0"),
    secs: String(s % 60).padStart(2, "0"),
  };
}

export default function WeeklyDraw() {
  const [countdown, setCountdown] = useState({ days: "0", hours: "00", mins: "00", secs: "00" });

  useEffect(() => {
    const target = getNextSunday();
    const tick = () => {
      const diff = target.getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-16 lg:py-20" style={{ borderTop: "1px solid #151515" }}>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div
          className="relative rounded-xl overflow-hidden p-8 lg:p-12"
          style={{
            background: "linear-gradient(135deg, #141414, #1a1209, #141414)",
            border: "1px solid rgba(255,77,0,0.15)",
          }}
        >
          {/* Glow */}
          <div
            className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full"
            style={{ background: "rgba(255,77,0,0.06)", filter: "blur(100px)" }}
          />

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: info */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                style={{ background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.2)" }}
              >
                <span className="text-label" style={{ color: "var(--color-accent)" }}>Weekly Draw</span>
              </div>

              <h2 className="text-display-md text-white">
                WIN A FREE<br />
                <span style={{ color: "var(--color-accent)" }}>HOOD COVER</span>
              </h2>
              <p className="text-body-sm mt-3 max-w-sm" style={{ color: "#888" }}>
                Every week we give away a free hood cover to one lucky subscriber.
                Enter your email for a chance to win. Runners-up get exclusive discount codes.
              </p>

              {/* Countdown */}
              <div className="flex gap-4 mt-6">
                {[
                  { val: countdown.days, label: "Days" },
                  { val: countdown.hours, label: "Hours" },
                  { val: countdown.mins, label: "Mins" },
                  { val: countdown.secs, label: "Secs" },
                ].map((t) => (
                  <div key={t.label} className="text-center">
                    <div
                      className="text-display-sm text-white px-3 py-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.05)", minWidth: "48px" }}
                    >
                      {t.val}
                    </div>
                    <div className="text-label mt-1.5" style={{ color: "#555" }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: email capture */}
            <div>
              <EmailCapture
                headline="ENTER THE DRAW"
                description="Drop your email to enter this week's draw. We'll also notify you about new designs and flash sales."
                source="giveaway"
                buttonText="Enter Draw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
