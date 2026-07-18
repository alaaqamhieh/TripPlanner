/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Places API (New) key — optional; live place search is hidden without it. */
  readonly VITE_GOOGLE_PLACES_KEY?: string
  /** Firebase Realtime Database URL — optional; trips stay local-only without it. */
  readonly VITE_FIREBASE_DB_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
