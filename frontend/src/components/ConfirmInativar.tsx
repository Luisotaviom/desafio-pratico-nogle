import { useState } from 'react'
import { inativarCliente, ApiError } from '../api/clientes'
import type { Cliente } from '../types'
import { Dialog } from './Dialog'

interface Props {
  cliente: Cliente
  onClose: () => void
  onDone: (c: Cliente) => void
}

export function ConfirmInativar({ cliente, onClose, onDone }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    setBusy(true)
    setError(null)
    try {
      onDone(await inativarCliente(cliente.id))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro inesperado ao inativar')
      setBusy(false)
    }
  }

  return (
    <Dialog titleId="confirm-titulo" onClose={onClose} busy={busy} className="dialog-confirm">
      <div className="dialog-body">
        <h2 id="confirm-titulo">Inativar cliente?</h2>
        <p>
          <strong>{cliente.nome}</strong> deixará de aparecer na lista. O cadastro é mantido e não é apagado.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <footer className="dialog-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy} autoFocus>Cancelar</button>
        <button type="button" className="btn btn-danger" onClick={confirmar} disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Inativando…' : 'Inativar'}
        </button>
      </footer>
    </Dialog>
  )
}
