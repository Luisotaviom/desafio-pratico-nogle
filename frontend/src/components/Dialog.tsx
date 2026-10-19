import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  titleId: string
  onClose: () => void
  children: ReactNode
  className?: string
  /** Impede fechar (ESC / clique fora) enquanto envia. */
  busy?: boolean
}

/** <dialog> nativo: trap de foco, ESC e devolução de foco ao fechar vêm do navegador. */
export function Dialog({ titleId, onClose, children, className = '', busy }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && !el.open) el.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
