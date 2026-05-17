import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** Bottom sheet — mobile-first. */
export function Sheet({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full bg-ink-soft text-paper rounded-t-3xl pt-3 pb-safe px-5 max-h-[85dvh] overflow-y-auto animate-pop-in"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-paper/30" />
        {title && (
          <h2 className="text-lg font-semibold mb-3 text-paper">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
