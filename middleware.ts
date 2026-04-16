import { NextResponse, type NextRequest } from "next/server";

/**
 * Sets the `geo_country` cookie from platform geo headers.
 *
 * Consumer: `lib/cart.ts` `getBuyerCountry()` reads this cookie and passes
 * the value to Shopify cart mutations as `buyerIdentity.countryCode` and
 * the `@inContext(country: ...)` directive. This drives Shopify's localized
 * pricing, currency, and checkout. If this middleware is removed or the
 * cookie is missing, `getBuyerCountry()` falls back to "US" for every
 * visitor — silently masking international currency/pricing bugs.
 *
 * Header sources:
 *  - Vercel:     `x-vercel-ip-country` (set automatically on Vercel infra)
 *  - Cloudflare: `cf-ipcountry`        (set automatically when CF is fronting)
 *  - Local dev:  `?_country=XX` query param override
 *
 * Cookie is `httpOnly: false` so client code (`lib/cart.ts` regex) can read it.
 * 24-hour TTL; not re-set on subsequent requests within that window.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Skip if cookie already set (avoid re-setting every request)
  if (request.cookies.get("geo_country")) {
    return response;
  }

  // Detect country from platform headers
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.nextUrl.searchParams.get("_country") ?? // dev override
    "";

  if (country) {
    response.cookies.set("geo_country", country, {
      httpOnly: false, // readable by client JS
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  }

  return response;
}

export const config = {
  // Run on all page routes, skip static assets and API
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
