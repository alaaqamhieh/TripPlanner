import { useEffect } from 'react'

/**
 * Locks body scrolling while a full-screen overlay is open, using the
 * position:fixed technique (plain overflow:hidden is unreliable in iOS
 * Safari). Fixing the body yanks it to scroll position 0, so we record
 * scrollY on lock and restore it on unlock — otherwise closing the overlay
 * would dump the user back at the top of the page.
 */
export function useBodyScrollLock() {
  useEffect(() => {
    const y = window.scrollY
    const { style } = document.body
    style.position = 'fixed'
    style.top = `-${y}px`
    style.left = '0'
    style.right = '0'
    style.width = '100%'
    return () => {
      style.position = ''
      style.top = ''
      style.left = ''
      style.right = ''
      style.width = ''
      window.scrollTo(0, y)
    }
  }, [])
}
