/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Places API (New) key — optional; live place search is hidden without it. */
  readonly VITE_GOOGLE_PLACES_KEY?: string
  /** Alternate name for the Google key, in case the secret was named this way. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** Firebase Realtime Database URL — optional; trips stay local-only without it. */
  readonly VITE_FIREBASE_DB_URL?: string
  /** Alternate name for the Firebase DB URL. */
  readonly VITE_FIREBASE_DATABASE_URL?: string
  /** Hosted AI proxy URL (Vercel function) — optional; AI features dormant without it. */
  readonly VITE_AI_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
