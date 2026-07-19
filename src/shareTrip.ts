import type { TripState } from './types'

// Share/backup links: the whole trip compressed into a URL hash. Opening the
// link on any device offers to import the trip there — no backend involved.

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const piped = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(piped).arrayBuffer())
}

/** Encode a whole trip for the URL hash. Prefix marks the encoding: z=deflate, j=plain. */
export async function encodeTrip(trip: TripState): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(trip))
  if (typeof CompressionStream !== 'undefined') {
    return 'z' + toBase64Url(await pipe(raw, new CompressionStream('deflate-raw')))
  }
  return 'j' + toBase64Url(raw)
}

export async function decodeTrip(encoded: string): Promise<TripState | null> {
  try {
    const kind = encoded[0]
    const bytes = fromBase64Url(encoded.slice(1))
    const raw = kind === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes
    const parsed = JSON.parse(new TextDecoder().decode(raw)) as TripState
    if (!parsed?.meta?.id || !Array.isArray(parsed.scheduled)) return null
    return parsed
  } catch {
    return null
  }
}

export async function shareUrl(trip: TripState): Promise<string> {
  // Built from the current origin so links work wherever the app is hosted.
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#trip=${await encodeTrip(trip)}`
}

/** Read a shared trip out of the current URL hash, if present. */
export function tripFromLocation(): string | null {
  const match = /#trip=([A-Za-z0-9_-]+)/.exec(window.location.hash)
  return match ? match[1] : null
}
