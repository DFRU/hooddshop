import Link from "next/link";
import Image from "next/image";
import type { Nation } from "@/lib/nations";

interface NationCardProps {
  nation: Nation;
  compact?: boolean;
}

export default function NationCard({ nation, compact }: NationCardProps) {
  // England uses gb-eng but flagcdn needs gb for the image (St George flag is not on flagcdn)
  // Use the code directly — flagcdn supports most ISO codes
  const flagCode = nation.code === "gb-eng" ? "gb-eng" : nation.code;
  const flagUrl = `https://flagcdn.com/w640/${flagCode}.png`;

  return (
    <Link
      href={`/nations/${nation.code}`}
      className={`group block overflow-hidden rounded-lg ${compact ? "" : "min-w-[75vw] lg:min-w-0"}`}
      style={{ background: "var(--color-surface)" }}
    >
      <div className="relative" style={{ aspectRatio: "3/2" }}>
        <Image
          src={flagUrl}
          alt={`${nation.name} flag`}
          fill
          sizes={compact ? "(max-width: 768px) 30vw, 16vw" : "(max-width: 768px) 75vw, 25vw"}
          className="object-cover transition-transform duration-200 lg:group-hover:scale-[1.02]"
        />
      </div>
      <div className="px-3 py-3">
        <p className="text-display-md text-white truncate" style={{ fontSize: compact ? "clamp(1rem, 3vw, 1.5rem)" : undefined }}>
          {nation.emoji} {nation.name}
        </p>
      </div>
    </Link>
  );
}
