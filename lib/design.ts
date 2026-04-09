export const DESIGN_LINES = [
  "Heritage",
  "Culture",
  "Street",
  "Stealth",
  "Chrome",
  "Jersey",
] as const;

export type DesignLine = (typeof DESIGN_LINES)[number];

/** Tailwind gradient classes for each design line */
export const DESIGN_GRADIENTS: Record<DesignLine, string> = {
  Heritage: "from-amber-900 via-amber-700 to-yellow-600",
  Culture: "from-purple-900 via-fuchsia-700 to-pink-500",
  Street: "from-zinc-900 via-red-800 to-orange-500",
  Stealth: "from-zinc-950 via-zinc-800 to-zinc-600",
  Chrome: "from-slate-400 via-slate-200 to-white",
  Jersey: "from-green-800 via-emerald-600 to-teal-400",
};

/** CSS class for the design gradient (for use with style prop) */
export const DESIGN_CSS_CLASS: Record<DesignLine, string> = {
  Heritage: "design-heritage",
  Culture: "design-culture",
  Street: "design-street",
  Stealth: "design-stealth",
  Chrome: "design-chrome",
  Jersey: "design-jersey",
};

/** Flag CDN URL helper */
export function flagUrl(code: string, width = 80): string {
  const c = code === "gb-eng" ? "gb" : code;
  return `https://flagcdn.com/w${width}/${c}.png`;
}
