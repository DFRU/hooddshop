import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware that detects US visitors via Vercel's geo headers
 * and sets a cookie so client components can conditionally show
 * "Made in the USA" messaging.
 *
 * On Vercel: x-vercel-ip-country is set automatically.
 * On Cloudflare: cf-ipcountry is set automatically.
 * Locally: defaults to no cookie (or set ?_country=US for testing).
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
