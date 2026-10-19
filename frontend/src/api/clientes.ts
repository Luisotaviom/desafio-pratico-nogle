import type { Cliente, ClienteInput } from '../types'
import { ApiError, mockApi } from './mock'

export { ApiError }

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3333/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar ao servidor')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const e = body?.error
    throw new ApiError(res.status, e?.code ?? 'INTERNAL_ERROR', e?.message ?? 'Erro inesperado', e?.fields)
  }
  return res.json() as Promise<T>
}

export interface ListParams {
  nome?: string
  cpf?: string
  ativo?: 'true' | 'false' | 'all'
}

export function listarClientes(params: ListParams = {}): Promise<Cliente[]> {
  if (USE_MOCK) return mockApi.list(params)
  const qs = new URLSearchParams()
  if (params.nome?.trim()) qs.set('nome', params.nome.trim())
  if (params.cpf) qs.set('cpf', params.cpf)
  if (params.ativo) qs.set('ativo', params.ativo)
  const s = qs.toString()
  return request<Cliente[]>(`/clientes${s ? `?${s}` : ''}`)
}

export function criarCliente(input: ClienteInput): Promise<Cliente> {
  if (USE_MOCK) return mockApi.create(input)
  return request<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(input) })
}

export function atualizarCliente(id: number, input: ClienteInput): Promise<Cliente> {
  if (USE_MOCK) return mockApi.update(id, input)
  return request<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function reativarCliente(id: number): Promise<Cliente> {
  if (USE_MOCK) return mockApi.ativar(id)
  return request<Cliente>(`/clientes/${id}/ativar`, { method: 'PATCH' })
}

export function inativarCliente(id: number): Promise<Cliente> {
  if (USE_MOCK) return mockApi.inativar(id)
  return request<Cliente>(`/clientes/${id}/inativar`, { method: 'PATCH' })
}

export interface CepResult {
  cep: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
}

export function consultarCep(cep: string, signal?: AbortSignal): Promise<CepResult> {
  return request<CepResult>(`/cep/${cep}`, { signal })
}
