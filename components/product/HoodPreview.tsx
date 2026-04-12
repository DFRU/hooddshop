"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────
interface HoodPreviewProps {
  imageUrl: string;
  productTitle: string;
}

type VehicleType = "sedan" | "suv" | "coupe";

interface VehicleConfig {
  name: string;
  label: string;
  hoodPath: string;
  carPath: string;
  maskId: string;
}

// ── SVG Car Silhouettes (Front 3/4 view) ──────────────────────

const VEHICLES: Record<VehicleType, VehicleConfig> = {
  sedan: {
    name: "sedan",
    label: "Sedan",
    maskId: "sedan-hood-mask",
    hoodPath: "M 180 120 Q 200 105 220 100 L 320 100 Q 340 105 360 120 L 360 200 Q 350 210 330 215 L 170 215 Q 150 210 140 200 Z",
    carPath: `
      M 100 150
      L 110 120
      Q 120 100 140 95
      L 340 95
      Q 360 100 370 120
      L 400 150
      L 410 200
      Q 405 230 380 240
      L 370 240
      L 360 280
      Q 355 310 330 320
      L 190 320
      Q 165 310 160 280
      L 150 240
      L 140 240
      Q 115 230 110 200
      Z
      M 160 260 Q 155 270 160 290 Q 165 310 180 315 L 190 315 Q 200 310 205 290 Q 210 270 205 255 Z
      M 330 260 Q 335 270 330 290 Q 325 310 310 315 L 300 315 Q 290 310 285 290 Q 280 270 285 255 Z
    `,
  },
  suv: {
    name: "suv",
    label: "SUV",
    maskId: "suv-hood-mask",
    hoodPath: "M 160 110 Q 180 95 200 90 L 320 90 Q 340 95 360 110 L 360 220 Q 350 230 330 235 L 170 235 Q 150 230 140 220 Z",
    carPath: `
      M 80 160
      L 90 110
      Q 100 85 120 75
      L 360 75
      Q 380 85 390 110
      L 420 160
      L 430 210
      Q 420 245 390 260
      L 370 260
      L 360 310
      Q 355 330 330 340
      L 190 340
      Q 165 330 160 310
      L 150 260
      L 130 260
      Q 100 245 90 210
      Z
      M 140 285 Q 135 300 140 320 Q 145 335 165 340 L 180 340 Q 195 335 200 315 Q 205 295 200 270 Z
      M 340 285 Q 345 300 340 320 Q 335 335 315 340 L 300 340 Q 285 335 280 315 Q 275 295 280 270 Z
    `,
  },
  coupe: {
    name: "coupe",
    label: "Coupe/Sports Car",
    maskId: "coupe-hood-mask",
    hoodPath: "M 200 125 Q 215 105 235 100 L 305 100 Q 325 105 340 125 L 340 210 Q 330 220 310 223 L 230 223 Q 210 220 200 210 Z",
    carPath: `
      M 140 170
      L 150 110
      Q 160 80 180 70
      L 360 70
      Q 380 80 390 110
      L 420 170
      L 430 215
      Q 415 255 380 270
      L 360 270
      L 345 325
      Q 340 345 315 355
      L 225 355
      Q 200 345 195 325
      L 180 270
      L 160 270
      Q 125 255 110 215
      Z
      M 170 310 Q 165 330 170 350 Q 175 360 195 365 L 215 365 Q 230 360 235 340 Q 240 315 235 290 Z
      M 345 310 Q 350 330 345 350 Q 340 360 320 365 L 300 365 Q 285 360 280 340 Q 275 315 280 290 Z
    `,
  },
};

// ── Component ─────────────────────────────────────────────────
export default function HoodPreview({ imageUrl, productTitle }: HoodPreviewProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const vehicle = VEHICLES[vehicleType];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = (e.clientX - rect.left - centerX) / centerX;
    const y = (e.clientY - rect.top - centerY) / centerY;

    setTilt({
      x: Math.max(-8, Math.min(8, y * 12)),
      y: Math.max(-8, Math.min(8, x * -12)),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="w-full" style={{ paddingLeft: "var(--container-px)", paddingRight: "var(--container-px)" }}>
      {/* Heading */}
      <h2
        className="text-display-sm font-bold mb-4 mt-6"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-text)",
        }}
      >
        Preview on Your Ride
      </h2>

      {/* Vehicle Type Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(Object.entries(VEHICLES) as Array<[VehicleType, VehicleConfig]>).map(
          ([key, config]) => (
            <button
              key={key}
              onClick={() => setVehicleType(key)}
              className="px-6 py-2 rounded-none font-semibold uppercase text-body-sm tracking-wider transition-all"
              style={{
                background:
                  vehicleType === key ? "var(--color-accent)" : "var(--color-surface-2)",
                color: vehicleType === key ? "white" : "var(--color-text-muted)",
                border: `1px solid ${vehicleType === key ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
            >
              {config.label}
            </button>
          )
        )}
      </div>

      {/* 3D Preview Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(26,26,26,0.8) 0%, rgba(10,10,10,1) 100%)",
          perspective: "1200px",
          maxHeight: "380px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Gradient floor/shadow */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "120px",
            background:
              "linear-gradient(180deg, rgba(255,77,0,0) 0%, rgba(255,77,0,0.15) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* SVG Car with Hood Image */}
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <svg
            viewBox="0 0 500 400"
            className="w-full"
            style={{
              maxWidth: "600px",
              height: "auto",
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Define clip path for hood area */}
            <defs>
              <clipPath id={vehicle.maskId}>
                <path d={vehicle.hoodPath} />
              </clipPath>

              {/* Gradient for hood highlight */}
              <linearGradient
                id="hood-highlight"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
              </linearGradient>

              {/* Shadow gradient */}
              <radialGradient id="car-shadow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            {/* Car shadow on ground */}
            <ellipse
              cx="250"
              cy="360"
              rx="160"
              ry="30"
              fill="url(#car-shadow)"
              opacity="0.6"
            />

            {/* Car body silhouette */}
            <path
              d={vehicle.carPath}
              fill="#1a1a1a"
              stroke="#333333"
              strokeWidth="1.5"
            />

            {/* Hood area with product image */}
            <g clipPath={`url(#${vehicle.maskId})`}>
              {/* Hood base color */}
              <path d={vehicle.hoodPath} fill="#0f0f0f" />

              {/* Product image (with perspective distortion via SVG image) */}
              {imageUrl && (
                <image
                  href={imageUrl}
                  x="140"
                  y="90"
                  width="220"
                  height="150"
                  preserveAspectRatio="xMidYMid slice"
                  style={{
                    opacity: 0.95,
                  }}
                />
              )}

              {/* Subtle highlight/reflection */}
              <path
                d={vehicle.hoodPath}
                fill="url(#hood-highlight)"
                opacity="0.6"
              />
            </g>

            {/* Window reflections (subtle) */}
            <path
              d="M 160 125 Q 165 130 170 128 L 200 115 Q 195 120 190 122 Z"
              fill="rgba(255,255,255,0.08)"
            />
            <path
              d="M 330 128 Q 335 130 340 125 L 310 115 Q 315 120 320 122 Z"
              fill="rgba(255,255,255,0.08)"
            />

            {/* Wheel highlights */}
            <circle
              cx="180"
              cy="300"
              r="3"
              fill="#444444"
              opacity="0.5"
            />
            <circle
              cx="320"
              cy="300"
              r="3"
              fill="#444444"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {/* Hover hint */}
      <p
        className="text-body-xs text-center mt-3 mb-4"
        style={{ color: "var(--color-text-muted)" }}
      >
        Hover to rotate the view
      </p>
    </div>
  );
}
