/**
 * Social proof section (spec §5.5)
 *
 * Zero-review state: UGC call-to-action with placeholder cards.
 * No fake reviews, no stock images.
 *
 * Future: pass reviews prop when review engine (Neon + pgvector spec) is live.
 * Build the conditional now per spec: render ReviewGrid if reviews exist,
 * placeholder otherwise.
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
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "#999999",
              lineHeight: 1.6,
            }}
          >
            {r.body}
          </p>
          <p
            className="mt-3"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#FFFFFF",
            }}
          >
            — {r.author}
          </p>
        </div>
      ))}
    </div>
  );
}

function UGCPlaceholder() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-center"
          style={{
            aspectRatio: "4/3",
            borderRadius: "2px",
            border: "1px dashed #1E1E1E",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "#333333",
            }}
          >
            Your photo here
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SocialProofSection({ reviews = [] }: Props) {
  return (
    <section
      className="py-12 lg:py-20"
      style={{ borderTop: "1px solid #151515" }}
    >
      <div className="max-w-[1280px] mx-auto px-[var(--container-px)] lg:px-[var(--container-px-lg)]">
        {/* Section header */}
        <div className="mb-8 lg:mb-10">
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            JOIN THE MOVEMENT
          </h2>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "16px",
              color: "#999999",
            }}
          >
            Tag your ride @hooddshopnow
          </p>
        </div>

        {/* Conditional: real reviews or placeholder */}
        {reviews.length > 0 ? (
          <ReviewGrid reviews={reviews} />
        ) : (
          <UGCPlaceholder />
        )}
      </div>
    </section>
  );
}
