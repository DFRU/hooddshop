import type { Metadata } from "next";
import CartDrawer from "@/components/layout/CartDrawer";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Hood'd — car hood covers that show your colours.",
};

export default function AboutPage() {
  return (
    <>
      <div className="min-h-[calc(100svh-56px)] flex items-center px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        <div className="max-w-[var(--max-width)] mx-auto w-full flex flex-col lg:flex-row gap-12 py-16">
          {/* Brand statement */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <h1 className="text-display-xl text-white">HOOD&apos;D</h1>
            <p className="text-body-lg mt-6" style={{ color: "var(--color-text-muted)" }}>
              {/* TODO: Replace with actual brand copy */}
              [BRAND STORY — INSERT TEXT]
            </p>
          </div>

          {/* Image placeholder */}
          <div className="lg:w-1/2">
            <div
              className="w-full rounded-lg flex items-center justify-center"
              style={{
                aspectRatio: "4/3",
                background: "var(--color-surface-2)",
              }}
            >
              {/* TODO: Replace gradient with actual product photo */}
              <span className="text-label" style={{ color: "var(--color-text-muted)" }}>
                [PRODUCT PHOTO — COVER ON CAR]
              </span>
            </div>
          </div>
        </div>
      </div>
      <CartDrawer />
    </>
  );
}
