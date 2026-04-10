import type { CustomerLocation } from "./types";
import { FALLBACK_LOCATION, IP_API_BASE } from "./constants";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function detectLocation(
  request: Request
): Promise<CustomerLocation> {
  // 1. Check for explicit query param override (?country=XX)
  const url = new URL(request.url);
  const countryOverride = url.searchParams.get("country");
  if (countryOverride) {
    return {
      country_code: countryOverride.toUpperCase(),
      lat: FALLBACK_LOCATION.lat,
      lng: FALLBACK_LOCATION.lng,
      source: "user_input",
    };
  }

  // 2. Check Vercel geo headers (available in production)
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  const vercelCity = request.headers.get("x-vercel-ip-city");
  const vercelLat = request.headers.get("x-vercel-ip-latitude");
  const vercelLng = request.headers.get("x-vercel-ip-longitude");

  if (vercelCountry) {
    return {
      country_code: vercelCountry,
      city: vercelCity || undefined,
      lat: vercelLat ? parseFloat(vercelLat) : FALLBACK_LOCATION.lat,
      lng: vercelLng ? parseFloat(vercelLng) : FALLBACK_LOCATION.lng,
      source: "vercel_headers",
    };
  }

  // 3. Fallback: ip-api.com (development only)
  try {
    const ipResp = await fetch(`${IP_API_BASE}/?fields=countryCode,city,lat,lon,regionName`, {
      signal: AbortSignal.timeout(3000),
    });
    if (ipResp.ok) {
      const data = await ipResp.json();
      if (data.countryCode) {
        return {
          country_code: data.countryCode,
          country_name: undefined,
          city: data.city,
          region: data.regionName,
          lat: data.lat,
          lng: data.lon,
          source: "ip_api",
        };
      }
    }
  } catch {
    // ip-api.com unavailable — fall through
  }

  // 4. Hard fallback
  return {
    country_code: FALLBACK_LOCATION.country_code,
    country_name: FALLBACK_LOCATION.country_name,
    lat: FALLBACK_LOCATION.lat,
    lng: FALLBACK_LOCATION.lng,
    source: "fallback",
  };
}
