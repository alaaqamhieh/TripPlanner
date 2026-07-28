import type { ReactNode } from 'react'

// A small set of elegant, single-weight line icons (Typeform-style) used on the
// questionnaire option rows and rapid-fire cards in place of emoji. Each entry
// is the inner geometry of a 24×24 stroke icon; the wrapper supplies the shared
// stroke styling so every icon reads as one consistent, theme-oriented set.

const ICONS = {
  // — People —
  person: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6 19a6 6 0 0 1 12 0" />
    </>
  ),
  couple: (
    <>
      <circle cx="8.5" cy="8.5" r="2.6" />
      <circle cx="15.5" cy="8.5" r="2.6" />
      <path d="M4.5 18.5a4 4 0 0 1 8 0" />
      <path d="M11.5 18.5a4 4 0 0 1 8 0" />
    </>
  ),
  family: (
    <>
      <circle cx="8" cy="7.5" r="2.6" />
      <path d="M4 18a4 4 0 0 1 8 0" />
      <circle cx="16.5" cy="10" r="2" />
      <path d="M13.5 18a3 3 0 0 1 6 0" />
    </>
  ),
  friends: (
    <>
      <circle cx="7" cy="9" r="2.3" />
      <circle cx="12" cy="7.5" r="2.3" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M3.5 18a3.5 3.5 0 0 1 7 0" />
      <path d="M13.5 18a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  people: (
    <>
      <circle cx="6" cy="9" r="2" />
      <circle cx="12" cy="7.8" r="2.2" />
      <circle cx="18" cy="9" r="2" />
      <path d="M8 18a4 4 0 0 1 8 0" />
      <path d="M3 18c0-1.9 1.4-3.4 3.2-3.5" />
      <path d="M17.8 14.5C19.6 14.6 21 16.1 21 18" />
    </>
  ),

  // — Budget —
  backpack: (
    <>
      <path d="M7 9a5 5 0 0 1 10 0v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0" />
      <path d="M9 14h6" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6.5" width="17" height="12" rx="2.5" />
      <path d="M3.5 10.5h17" />
      <circle cx="16.5" cy="14" r="1" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M18.5 14.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" />
    </>
  ),
  crown: (
    <>
      <path d="M4 8l3.5 3L12 6l4.5 5L20 8l-1.5 9h-13z" />
      <path d="M6.5 17h11" />
    </>
  ),

  // — Pace / style / rhythm —
  leaf: (
    <>
      <path d="M5 19c0-8 6.5-13 14-13 0 7.5-5 14-13 14-.6 0-1-.4-1-1z" />
      <path d="M8.5 15.5C11 13 13 11 15.5 9.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  bolt: <path d="M13 3L5 13h6l-1 8 8-11h-6z" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </>
  ),
  map: (
    <>
      <path d="M9 4L3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  wind: (
    <>
      <path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 12h16a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 16h8a2 2 0 1 1-2 2" />
    </>
  ),
  sunrise: (
    <>
      <path d="M3 18.5h18" />
      <path d="M7 18.5a5 5 0 0 1 10 0" />
      <path d="M12 4.5v3M5.5 8.5l1.4 1.4M18.5 8.5L17.1 9.9M2.5 14h2M19.5 14h2" />
    </>
  ),
  cloudSun: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2.5v1.4M2.5 8h1.4M3.9 3.9l1 1M12.1 3.9l-1 1" />
      <path d="M9 18.5h8a3 3 0 0 0 0-6 4 4 0 0 0-7.7-1" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,

  // — Food & diet —
  bowl: (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M8.5 8.5c0-1.5 1-2 1-3.5" />
      <path d="M12 8.5c0-1.5 1-2 1-3.5" />
    </>
  ),
  forkKnife: (
    <>
      <path d="M8 3v6a2 2 0 0 1-4 0V3" />
      <path d="M6 9v12" />
      <path d="M17 3c-1.7 0-3 2.7-3 6 0 2.2 1 3.6 3 4v8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3 3 15 0 18" />
      <path d="M12 3c-3 3-3 15 0 18" />
    </>
  ),
  crescent: (
    <>
      <path d="M16.5 4.2a8 8 0 1 0 3.3 12.3A6.5 6.5 0 0 1 16.5 4.2z" />
      <path d="M19 5.4l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20.5v-8" />
      <path d="M12 12.5C12 8.5 9 6.5 5 6.5c0 4 3 6 7 6z" />
      <path d="M12 12.5c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V7" />
      <path d="M12 12c-2-.8-3-2.6-2.6-4.6" />
      <path d="M12 12c2-.8 3-2.6 2.6-4.6" />
      <path d="M12 17c-2-.8-3-2.6-2.6-4.6" />
      <path d="M12 17c2-.8 3-2.6 2.6-4.6" />
      <path d="M12 8c-1.8-.8-2.7-2.5-2.3-4.4C11.4 4.3 12 6 12 8z" />
      <path d="M12 8c1.8-.8 2.7-2.5 2.3-4.4C12.6 4.3 12 6 12 8z" />
    </>
  ),
  star: <path d="M12 3l2.5 6.1 6.5.5-5 4.2 1.6 6.3L12 17.3 6.4 20.6 8 14.3l-5-4.2 6.5-.5z" />,

  // — Must-haves —
  monument: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6 20.5V9l6-4 6 4v11.5" />
      <path d="M6 9h12" />
      <path d="M10 20.5V14a2 2 0 0 1 4 0v6.5" />
    </>
  ),
  gem: (
    <>
      <path d="M6 4h12l3 5-9 11L3 9z" />
      <path d="M3 9h18" />
      <path d="M9 4L7 9l5 11" />
      <path d="M15 4l2 5-5 11" />
    </>
  ),
  mountain: (
    <>
      <path d="M3 19l6-10 4 6 2-3 6 7z" />
      <circle cx="17" cy="7" r="1.6" />
    </>
  ),
  basket: (
    <>
      <path d="M4 9h16l-1.4 10a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7z" />
      <path d="M8 9l2.5-4M16 9l-2.5-4" />
      <path d="M9 13v3.5M12 13v3.5M15 13v3.5" />
    </>
  ),
  car: (
    <>
      <path d="M4.5 14.5l1.4-4.6A2 2 0 0 1 7.8 8.5h8.4a2 2 0 0 1 1.9 1.4l1.4 4.6" />
      <rect x="3" y="14.5" width="18" height="4.5" rx="1.4" />
      <circle cx="7.5" cy="19" r="1.4" />
      <circle cx="16.5" cy="19" r="1.4" />
    </>
  ),

  // — Interests (rapid-fire) —
  beach: (
    <>
      <path d="M12 5v8.5" />
      <path d="M4.5 11a7.5 7.5 0 0 1 15 0z" />
      <path d="M3 19c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" />
    </>
  ),
  glass: (
    <>
      <path d="M5 5h14l-7 8z" />
      <path d="M12 13v5.5" />
      <path d="M8.5 18.5h7" />
      <circle cx="15.6" cy="7.6" r="1" />
    </>
  ),
  painting: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.6" />
      <path d="M7 15.5l3.2-3.2 2.3 2L16 9.5l1.2 2" />
      <circle cx="9" cy="9" r="1.2" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l-1 11.2a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  spa: (
    <>
      <path d="M12 20.5c-4 0-7-3-7-6.2 3 0 5.6 1.5 7 4.1 1.4-2.6 4-4.1 7-4.1 0 3.2-3 6.2-7 6.2z" />
      <path d="M12 13.5c-1.6-2-1.6-5.2 0-7.2 1.6 2 1.6 5.2 0 7.2z" />
    </>
  ),
  ferris: (
    <>
      <circle cx="12" cy="10" r="7" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M12 3v14M5 10h14M7.05 5.05l9.9 9.9M16.95 5.05l-9.9 9.9" />
      <path d="M12 17v4M9 21h6" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}
