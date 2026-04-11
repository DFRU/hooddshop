export interface Nation {
  code: string;
  name: string;
  emoji: string;
  region: Region;
  confederation: string;
  wc2026: boolean;
}

export type Region =
  | "Americas"
  | "Europe"
  | "Africa"
  | "Asia-Pacific"
  | "Middle East";

export const NATIONS: Nation[] = [
  // ── HOSTS ──────────────────────────────────────────────
  { code: "us", name: "United States", emoji: "\u{1F1FA}\u{1F1F8}", region: "Americas", confederation: "CONCACAF", wc2026: true },
  { code: "ca", name: "Canada", emoji: "\u{1F1E8}\u{1F1E6}", region: "Americas", confederation: "CONCACAF", wc2026: true },
  { code: "mx", name: "Mexico", emoji: "\u{1F1F2}\u{1F1FD}", region: "Americas", confederation: "CONCACAF", wc2026: true },

  // ── CONCACAF ───────────────────────────────────────────
  { code: "pa", name: "Panama", emoji: "\u{1F1F5}\u{1F1E6}", region: "Americas", confederation: "CONCACAF", wc2026: true },
  { code: "cw", name: "Curaçao", emoji: "\u{1F1E8}\u{1F1FC}", region: "Americas", confederation: "CONCACAF", wc2026: true },
  { code: "ht", name: "Haiti", emoji: "\u{1F1ED}\u{1F1F9}", region: "Americas", confederation: "CONCACAF", wc2026: true },
  { code: "jm", name: "Jamaica", emoji: "\u{1F1EF}\u{1F1F2}", region: "Americas", confederation: "CONCACAF", wc2026: true },

  // ── CONMEBOL ───────────────────────────────────────────
  { code: "ar", name: "Argentina", emoji: "\u{1F1E6}\u{1F1F7}", region: "Americas", confederation: "CONMEBOL", wc2026: true },
  { code: "br", name: "Brazil", emoji: "\u{1F1E7}\u{1F1F7}", region: "Americas", confederation: "CONMEBOL", wc2026: true },
  { code: "co", name: "Colombia", emoji: "\u{1F1E8}\u{1F1F4}", region: "Americas", confederation: "CONMEBOL", wc2026: true },
  { code: "ec", name: "Ecuador", emoji: "\u{1F1EA}\u{1F1E8}", region: "Americas", confederation: "CONMEBOL", wc2026: true },
  { code: "py", name: "Paraguay", emoji: "\u{1F1F5}\u{1F1FE}", region: "Americas", confederation: "CONMEBOL", wc2026: true },
  { code: "uy", name: "Uruguay", emoji: "\u{1F1FA}\u{1F1FE}", region: "Americas", confederation: "CONMEBOL", wc2026: true },

  // ── UEFA ───────────────────────────────────────────────
  { code: "gb-eng", name: "England", emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "fr", name: "France", emoji: "\u{1F1EB}\u{1F1F7}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "de", name: "Germany", emoji: "\u{1F1E9}\u{1F1EA}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "es", name: "Spain", emoji: "\u{1F1EA}\u{1F1F8}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "pt", name: "Portugal", emoji: "\u{1F1F5}\u{1F1F9}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "it", name: "Italy", emoji: "\u{1F1EE}\u{1F1F9}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "nl", name: "Netherlands", emoji: "\u{1F1F3}\u{1F1F1}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "be", name: "Belgium", emoji: "\u{1F1E7}\u{1F1EA}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "hr", name: "Croatia", emoji: "\u{1F1ED}\u{1F1F7}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "rs", name: "Serbia", emoji: "\u{1F1F7}\u{1F1F8}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "ch", name: "Switzerland", emoji: "\u{1F1E8}\u{1F1ED}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "dk", name: "Denmark", emoji: "\u{1F1E9}\u{1F1F0}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "pl", name: "Poland", emoji: "\u{1F1F5}\u{1F1F1}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "at", name: "Austria", emoji: "\u{1F1E6}\u{1F1F9}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "no", name: "Norway", emoji: "\u{1F1F3}\u{1F1F4}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "gb-sct", name: "Scotland", emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "se", name: "Sweden", emoji: "\u{1F1F8}\u{1F1EA}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "tr", name: "Turkey", emoji: "\u{1F1F9}\u{1F1F7}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "ba", name: "Bosnia and Herzegovina", emoji: "\u{1F1E7}\u{1F1E6}", region: "Europe", confederation: "UEFA", wc2026: true },
  { code: "cz", name: "Czechia", emoji: "\u{1F1E8}\u{1F1FF}", region: "Europe", confederation: "UEFA", wc2026: true },

  // ── CAF ────────────────────────────────────────────────
  { code: "ma", name: "Morocco", emoji: "\u{1F1F2}\u{1F1E6}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "ng", name: "Nigeria", emoji: "\u{1F1F3}\u{1F1EC}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "sn", name: "Senegal", emoji: "\u{1F1F8}\u{1F1F3}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "cm", name: "Cameroon", emoji: "\u{1F1E8}\u{1F1F2}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "gh", name: "Ghana", emoji: "\u{1F1EC}\u{1F1ED}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "dz", name: "Algeria", emoji: "\u{1F1E9}\u{1F1FF}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "cv", name: "Cape Verde", emoji: "\u{1F1E8}\u{1F1FB}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "cd", name: "DR Congo", emoji: "\u{1F1E8}\u{1F1E9}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "eg", name: "Egypt", emoji: "\u{1F1EA}\u{1F1EC}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "ci", name: "Ivory Coast", emoji: "\u{1F1E8}\u{1F1EE}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "za", name: "South Africa", emoji: "\u{1F1FF}\u{1F1E6}", region: "Africa", confederation: "CAF", wc2026: true },
  { code: "tn", name: "Tunisia", emoji: "\u{1F1F9}\u{1F1F3}", region: "Africa", confederation: "CAF", wc2026: true },

  // ── AFC ────────────────────────────────────────────────
  { code: "jp", name: "Japan", emoji: "\u{1F1EF}\u{1F1F5}", region: "Asia-Pacific", confederation: "AFC", wc2026: true },
  { code: "kr", name: "South Korea", emoji: "\u{1F1F0}\u{1F1F7}", region: "Asia-Pacific", confederation: "AFC", wc2026: true },
  { code: "au", name: "Australia", emoji: "\u{1F1E6}\u{1F1FA}", region: "Asia-Pacific", confederation: "AFC", wc2026: true },
  { code: "sa", name: "Saudi Arabia", emoji: "\u{1F1F8}\u{1F1E6}", region: "Middle East", confederation: "AFC", wc2026: true },
  { code: "ir", name: "Iran", emoji: "\u{1F1EE}\u{1F1F7}", region: "Middle East", confederation: "AFC", wc2026: true },
  { code: "iq", name: "Iraq", emoji: "\u{1F1EE}\u{1F1F6}", region: "Middle East", confederation: "AFC", wc2026: true },
  { code: "jo", name: "Jordan", emoji: "\u{1F1EF}\u{1F1F4}", region: "Middle East", confederation: "AFC", wc2026: true },
  { code: "qa", name: "Qatar", emoji: "\u{1F1F6}\u{1F1E6}", region: "Middle East", confederation: "AFC", wc2026: true },
  { code: "uz", name: "Uzbekistan", emoji: "\u{1F1FA}\u{1F1FF}", region: "Asia-Pacific", confederation: "AFC", wc2026: true },

  // ── OFC ────────────────────────────────────────────────
  { code: "nz", name: "New Zealand", emoji: "\u{1F1F3}\u{1F1FF}", region: "Asia-Pacific", confederation: "OFC", wc2026: true },
];

export function getNation(code: string): Nation | undefined {
  return NATIONS.find((n) => n.code === code);
}

export function getWC2026Nations(): Nation[] {
  return NATIONS.filter((n) => n.wc2026);
}

export function getNationsByRegion(): Record<Region, Nation[]> {
  return NATIONS.reduce(
    (acc, nation) => {
      if (!acc[nation.region]) acc[nation.region] = [];
      acc[nation.region].push(nation);
      return acc;
    },
    {} as Record<Region, Nation[]>
  );
}

// Home page hero nations (8 biggest by global fan base)
export const HOME_FEATURED_NATIONS = [
  "br", "ar", "fr", "gb-eng", "es", "de", "mx", "us",
];
