"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const CONCEPTS = [
  { src: "/images/concepts/france_bold_typographic.png", nation: "France" },
  { src: "/images/concepts/japan_bold_typographic.png", nation: "Japan" },
  { src: "/images/concepts/england_bold_typographic.png", nation: "England" },
  { src: "/images/concepts/croatia_bold_typographic.png", nation: "Croatia" },
  { src: "/images/concepts/netherlands_bold_typographic.png", nation: "Netherlands" },
  { src: "/images/concepts/uruguay_bold_typographic.png", nation: "Uruguay" },
  { src: "/images/concepts/senegal_bold_typographic.png", nation: "Senegal" },
  { src: "/images/concepts/saudi_arabia_bold_typographic.png", nation: "Saudi Arabia" },
  { src: "/images/concepts/iran_bold_typographic.png", nation: "Iran" },
  { src: "/images/concepts/switzerland_bold_typographic.png", nation: "Switzerland" },
  { src: "/images/concepts/cameroon_bold_typographic.png", nation: "Cameroon" },
  { src: "/images/concepts/serbia_bold_typographic.png", nation: "Serbia" },
];

// Double the array for seamless infinite scroll
const SCROLL_ITEMS = [...CONCEPTS, ...CONCEPTS];

export default function ConceptShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame: number;
    let pos = 0;
    const speed = 0.5; // px per frame

    function tick() {
      pos += speed;
      // Reset to start when first set scrolls out
      const half = el!.scrollWidth / 2;
      if (pos >= half) pos = 0;
      el!.scrollLeft = pos;
      frame = requestAnimationFrame(tick);
    }

    // Pause on hover
    const pause = () => cancelAnimationFrame(frame);
    const resume = () => { frame = requestAnimationFrame(tick); };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-12 lg:py-20" style={{ background: "#050505", borderTop: "1px solid #151515" }}>
      {/* Headline */}
      <div className="relative px-[var(--container-px)] lg:px-[var(--container-px-lg)] pb-6 lg:pb-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-display-lg text-white">
            NEW DESIGNS<br />
            <span style={{ color: "var(--color-accent)" }}>DROPPING SOON</span>
          </h2>
          <p className="text-body-sm lg:text-body-md mt-3 max-w-md mx-auto" style={{ color: "#888" }}>
            Concept renders of our next wave. More nations, more styles, more heat. Join the list to get notified when they drop.
          </p>
        </div>
      </div>

      {/* Concept car gallery — auto-scrolling row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-hidden py-4 lg:py-6"
        style={{ scrollbarWidth: "none" }}
      >
        {SCROLL_ITEMS.map((c, i) => (
          <div
            key={`${c.nation}-${i}`}
            className="flex-shrink-0 w-[280px] sm:w-[340px] lg:w-[420px]"
          >
            <div
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{ aspectRatio: "16/10", border: "1px solid #1a1a1a" }}
            >
              <Image
                src={c.src}
                alt={`${c.nation} concept car hood cover`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 420px"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
                <div className="text-display-sm text-white">{c.nation}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient overlay — fades edges */}
      <div className="absolute inset-y-0 left-0 w-16 lg:w-32 pointer-events-none" style={{ background: "linear-gradient(to right, #050505, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-16 lg:w-32 pointer-events-none" style={{ background: "linear-gradient(to left, #050505, transparent)" }} />
    </section>
  );
}
