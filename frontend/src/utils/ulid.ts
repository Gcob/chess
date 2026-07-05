// Simulated ULID — placeholder until the Laravel backend/DB becomes the source of real ULIDs.
// Follows the ULID shape (26 chars, Crockford base32: 48-bit timestamp + 80 random bits) so the
// frontend already works with the id structure the backend will use. Not spec-complete on purpose
// (no monotonic factory) — good enough for local games.

// Crockford base32 alphabet — no I, L, O, U
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const ULID_LENGTH = 26
const TIME_LENGTH = 10
const RANDOM_LENGTH = 16

export function generateUlid(now: number = Date.now()): string {
  let time = ''
  let remaining = now
  for (let i = 0; i < TIME_LENGTH; i++) {
    time = ENCODING[remaining % 32] + time
    remaining = Math.floor(remaining / 32)
  }

  // 256 is a multiple of 32, so byte % 32 is uniformly distributed
  let random = ''
  for (const byte of randomBytes(RANDOM_LENGTH)) {
    random += ENCODING[byte % 32]
  }

  return time + random
}

// Local games don't need cryptographic randomness — Math.random is a fine fallback when the
// Web Crypto API is unavailable (non-secure contexts, bare test runners).
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(bytes)
  }

  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }

  return bytes
}
