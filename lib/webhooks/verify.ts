/**
 * Shopify webhook HMAC verification.
 * Spec: UPLOAD-PIPELINE-SPEC.md §6.1
 *
 * Uses Web Crypto API (available in Node 18+ and Vercel Edge).
 */

const encoder = new TextEncoder();

/**
 * Verify a Shopify webhook HMAC-SHA256 signature.
 * Returns true if the signature matches.
 */
export async function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );

  const computed = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );

  // Constant-time comparison via subtle.timingSafeEqual is not available in
  // Web Crypto, so we use a byte-by-byte approach with no early exit.
  if (computed.length !== hmacHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Compute SHA-256 hash of a string (for body_hash audit column).
 */
export async function sha256(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
