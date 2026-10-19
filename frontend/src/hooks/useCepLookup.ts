import { useEffect, useState } from 'react'
import { ApiError, consultarCep, type CepResult } from '../api/clientes'

export type { CepResult }
export type CepStatus = 'idle' | 'loading' | 'notFound' | 'unavailable'

export interface CepLookup {
  data: CepResult | null
  status: CepStatus
}

/**
 * Consulta o CEP (GET /cep/:cep) assim que ele tem 8 dígitos. Recebe só dígitos;
 * com `enabled` falso não consulta. Cancela a requisição anterior se o CEP mudar.
 */
export function useCepLookup(cep: string, enabled = true): CepLookup {
  const [state, setState] = useState<CepLookup>({ data: null, status: 'idle' })

  useEffect(() => {
    if (!enabled || cep.length !== 8) {
      setState((s) => (s.status === 'idle' && !s.data ? s : { data: null, status: 'idle' }))
      return
    }
    const controller = new AbortController()
    setState({ data: null, status: 'loading' })
    consultarCep(cep, controller.signal)
      .then((data) => setState({ data, status: 'idle' }))
      .catch((err) => {
        if (controller.signal.aborted) return
        setState({ data: null, status: err instanceof ApiError && err.status === 404 ? 'notFound' : 'unavailable' })
      })
    return () => controller.abort()
  }, [cep, enabled])

  return state
}
