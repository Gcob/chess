import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateUlid, ULID_LENGTH } from './ulid'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateUlid', () => {
  it('produces 26 chars from the Crockford base32 alphabet', () => {
    const ulid = generateUlid()
    expect(ulid).toHaveLength(ULID_LENGTH)
    expect(ulid).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/)
  })

  it('is unique across many generations', () => {
    const ulids = new Set(Array.from({ length: 1000 }, () => generateUlid()))
    expect(ulids.size).toBe(1000)
  })

  it('sorts lexicographically by timestamp', () => {
    const earlier = generateUlid(1_000_000_000_000)
    const later = generateUlid(2_000_000_000_000)
    expect(earlier < later).toBe(true)
  })

  it('encodes the same timestamp into the same time prefix', () => {
    const a = generateUlid(1_700_000_000_000)
    const b = generateUlid(1_700_000_000_000)
    expect(a.slice(0, 10)).toBe(b.slice(0, 10))
  })

  it('is deterministic when the randomness source is stubbed', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0),
    })
    expect(generateUlid(0)).toBe('0'.repeat(ULID_LENGTH))
  })

  it('falls back to Math.random when Web Crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined)
    expect(generateUlid()).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/)
  })
})
