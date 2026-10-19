import type { ClienteInput, FieldErrors } from '../types'
import { onlyDigits } from './format'

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const dv = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10])
}

/** Valida um campo; retorna a mensagem de erro ou undefined. */
export function validateField(name: keyof ClienteInput, values: ClienteInput): string | undefined {
  const v = (values[name] ?? '').toString().trim()
  switch (name) {
    case 'complemento':
      return undefined
    case 'cpf':
      if (!v) return 'Informe o CPF'
      return isValidCpf(v) ? undefined : 'CPF inválido'
    case 'telefone': {
      if (!v) return 'Informe o telefone'
      const len = onlyDigits(v).length
      return len === 10 || len === 11 ? undefined : 'Telefone deve ter 10 ou 11 dígitos'
    }
    case 'cep':
      if (!v) return 'Informe o CEP'
      return onlyDigits(v).length === 8 ? undefined : 'CEP deve ter 8 dígitos'
    case 'estado':
      if (!v) return 'Informe o estado'
      return /^[A-Za-z]{2}$/.test(v) ? undefined : 'Use a sigla com 2 letras'
    default:
      return v ? undefined : 'Campo obrigatório'
  }
}

export const CAMPOS: (keyof ClienteInput)[] = [
  'nome', 'cpf', 'telefone', 'cep', 'cidade', 'estado', 'endereco', 'bairro', 'numero', 'complemento',
]

export function validateAll(values: ClienteInput): FieldErrors {
  const errors: FieldErrors = {}
  for (const c of CAMPOS) {
    const e = validateField(c, values)
    if (e) errors[c] = e
  }
  return errors
}
