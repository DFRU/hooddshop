/**
 * Minimal ULID generator — no external dependencies.
 * ULIDs are used as print_jobs.id for sortable, unique identifiers.
 *
 * Format: 10-char timestamp (Crockford base32) + 16-char random
 * Spec: https://github.com/ulid/spec
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(time: number, length: number): string {
  let str = "";
  for (let i = length - 1; i >= 0; i--) {
    const mod = time % 32;
    str = CROCKFORD[mod] + str;
    time = Math.floor(time / 32);
  }
  return str;
}

function encodeRandom(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let str = "";
  for (let i = 0; i < length; i++) {
    str += CROCKFORD[bytes[i] % 32];
  }
  return str;
}

/**
 * Generate a ULID (26 characters, Crockford base32).
 */
export function ulid(): string {
  const time = Date.now();
  return encodeTime(time, 10) + encodeRandom(16);
}
