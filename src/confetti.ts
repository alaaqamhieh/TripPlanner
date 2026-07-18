const COLORS = ['#0f6b66', '#e2694a', '#d9a441', '#8a4b6b', '#58a7a1', '#eb9077']

/** Small celebratory burst at (x, y) in viewport coordinates. */
export function burstConfetti(x: number, y: number, count = 22): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    piece.className = 'confetti'
    piece.style.left = `${x}px`
    piece.style.top = `${y}px`
    piece.style.background = COLORS[i % COLORS.length]
    piece.style.setProperty('--dx', `${(Math.random() - 0.5) * 260}px`)
    piece.style.setProperty('--dy', `${120 + Math.random() * 220}px`)
    piece.style.setProperty('--rot', `${360 + Math.random() * 540}deg`)
    piece.style.setProperty('--dur', `${0.9 + Math.random() * 0.8}s`)
    document.body.appendChild(piece)
    piece.addEventListener('animationend', () => piece.remove())
  }
}

/** Convenience: burst from the center of the element that was interacted with. */
export function burstFromElement(el: Element | null): void {
  if (!el) return
  const r = el.getBoundingClientRect()
  burstConfetti(r.left + r.width / 2, r.top + r.height / 2)
}
