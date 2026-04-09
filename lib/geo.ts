/**
 * Client-side geo detection utilities.
 * Reads the geo_country cookie set by middleware.ts.
 */

export function getCountryFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)geo_country=([^;]*)/);
  return match?.[1] ?? "";
}

export function isUSVisitor(): boolean {
  return getCountryFromCookie() === "US";
}
