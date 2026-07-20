// ---------------------------------------------------------------------------
// Real photos for places, with no API key required. Google Places photos are
// used when a rec already carries one; otherwise we resolve a free, real image
// from Wikipedia's REST summary endpoint (CORS-enabled, hotlinkable).
// Results are cached in-memory + sessionStorage so a deck never re-fetches.
// ---------------------------------------------------------------------------

const memCache = new Map<string, string>()

function cacheGet(key: string): string | undefined {
  if (memCache.has(key)) return memCache.get(key)
  try {
    const v = sessionStorage.getItem(`tripplanner/photo/${key}`)
    if (v !== null) {
      memCache.set(key, v)
      return v
    }
  } catch {
    // sessionStorage unavailable — memory cache only
  }
  return undefined
}

function cacheSet(key: string, url: string): void {
  memCache.set(key, url)
  try {
    sessionStorage.setItem(`tripplanner/photo/${key}`, url)
  } catch {
    // ignore quota / unavailable
  }
}

interface WikiSummary {
  originalimage?: { source?: string }
  thumbnail?: { source?: string }
}

/**
 * Resolve a real photo URL for a place. Tries, in order: an explicit title,
 * then "<title>, <destination>", then the raw query. Returns '' if nothing
 * is found (caller shows an emoji/gradient placeholder). Never throws.
 */
export async function resolvePhoto(query: string, destination?: string): Promise<string> {
  const key = `${query}|${destination ?? ''}`.toLowerCase()
  const cached = cacheGet(key)
  if (cached !== undefined) return cached

  const candidates = [query, destination ? `${query} ${destination}` : '', destination ?? '']
    .map((s) => s.trim())
    .filter(Boolean)

  for (const title of candidates) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`,
        { headers: { Accept: 'application/json' } },
      )
      if (!res.ok) continue
      const data = (await res.json()) as WikiSummary
      const url = data.originalimage?.source ?? data.thumbnail?.source
      if (url) {
        cacheSet(key, url)
        return url
      }
    } catch {
      // network/CORS hiccup — try the next candidate
    }
  }
  cacheSet(key, '')
  return ''
}
