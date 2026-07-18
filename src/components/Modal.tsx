import { useEffect, type ReactNode } from 'react'

interface Props {
  onClose: () => void
  children: ReactNode
  /** Extra class on the dialog, e.g. "modal-tall" for scroll-body + fixed-footer layout. */
  className?: string
}

export default function Modal({ onClose, children, className }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  )
}
