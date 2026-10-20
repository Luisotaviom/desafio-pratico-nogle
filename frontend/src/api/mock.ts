// Mock em memória dos endpoints do contrato (docs/api.md). Ativo com VITE_USE_MOCK=true.
import type { Cliente, ClienteInput } from '../types'
import { isValidCpf } from '../lib/validation'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

let nextId = 6
const db: Cliente[] = [
  { id: 1, nome: 'Maria Silva', cpf: '52998224725', telefone: '11987654321', cep: '01310100', cidade: 'São Paulo', estado: 'SP', endereco: 'Avenida Paulista', bairro: 'Bela Vista', numero: '1000', complemento: 'Apto 12', ativo: true },
  { id: 2, nome: 'João Pereira', cpf: '11144477735', telefone: '2133334444', cep: '20040020', cidade: 'Rio de Janeiro', estado: 'RJ', endereco: 'Rua da Assembleia', bairro: 'Centro', numero: '10', complemento: null, ativo: true },
  { id: 3, nome: 'Ana Beatriz Costa', cpf: '39053344705', telefone: '31999887766', cep: '30140071', cidade: 'Belo Horizonte', estado: 'MG', endereco: 'Avenida Afonso Pena', bairro: 'Centro', numero: '1500', complemento: 'Sala 3', ativo: true },
  { id: 4, nome: 'Carlos Eduardo Lima', cpf: '86288366757', telefone: '41988776655', cep: '80010000', cidade: 'Curitiba', estado: 'PR', endereco: 'Rua XV de Novembro', bairro: 'Centro', numero: '300', complemento: null, ativo: true },
  { id: 5, nome: 'Fernanda Rocha', cpf: '71428793860', telefone: '51977665544', cep: '90010000', cidade: 'Porto Alegre', estado: 'RS', endereco: 'Rua dos Andradas', bairro: 'Centro Histórico', numero: '45', complemento: 'Fundos', ativo: false },
]

type Filtros = { nome?: string; cpf?: string; estado?: string; cidade?: string }

function filtrar(f: Filtros): Cliente[] {
  const nome = (f.nome ?? '').trim().toLowerCase()
  const cpf = (f.cpf ?? '').replace(/\D/g, '')
  const cidade = (f.cidade ?? '').trim().toLowerCase()
  const estado = (f.estado ?? '').toUpperCase()
  return db.filter(
    (c) =>
      c.nome.toLowerCase().includes(nome) &&
      c.cpf.includes(cpf) &&
      c.cidade.toLowerCase().includes(cidade) &&
      (!estado || c.estado === estado),
  )
}

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms))
const clone = <T,>(v: T): T => structuredClone(v)

function validate(input: ClienteInput, ignoreId?: number) {
  const fields: Record<string, string> = {}
  const req = ['nome', 'cpf', 'telefone', 'cep', 'cidade', 'estado', 'endereco', 'bairro', 'numero'] as const
  for (const k of req) if (!String(input[k] ?? '').trim()) fields[k] = 'Campo obrigatório'
  if (!fields.cpf && !isValidCpf(input.cpf)) fields.cpf = 'CPF inválido'
  if (!fields.telefone && !/^\d{10,11}$/.test(input.telefone)) fields.telefone = 'Telefone deve ter 10 ou 11 dígitos'
  if (!fields.cep && !/^\d{8}$/.test(input.cep)) fields.cep = 'CEP deve ter 8 dígitos'
  if (!fields.estado && !/^[A-Z]{2}$/.test(input.estado)) fields.estado = 'Estado deve ter 2 letras maiúsculas'
  if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', fields)
  if (db.some((c) => c.cpf === input.cpf && c.id !== ignoreId))
    throw new ApiError(409, 'CPF_DUPLICADO', 'CPF já cadastrado', { cpf: 'CPF já cadastrado' })
}

export const mockApi = {
  async list(f: Filtros & { ativo?: 'true' | 'false' | 'all' }): Promise<Cliente[]> {
    await wait()
    const ativo = f.ativo ?? 'true'
    return clone(filtrar(f).filter((c) => ativo === 'all' || c.ativo === (ativo === 'true')))
  },
  async resumo(f: Filtros): Promise<{ ativos: number; inativos: number; total: number }> {
    await wait(150)
    const lista = filtrar(f)
    const ativos = lista.filter((c) => c.ativo).length
    return { ativos, inativos: lista.length - ativos, total: lista.length }
  },
  async create(input: ClienteInput): Promise<Cliente> {
    await wait()
    validate(input)
    const c: Cliente = { ...input, complemento: input.complemento || null, id: nextId++, ativo: true }
    db.push(c)
    return clone(c)
  },
  async update(id: number, input: ClienteInput): Promise<Cliente> {
    await wait()
    const c = db.find((x) => x.id === id)
    if (!c) throw new ApiError(404, 'NOT_FOUND', 'Cliente não encontrado')
    validate(input, id)
    Object.assign(c, input, { complemento: input.complemento || null })
    return clone(c)
  },
  async ativar(id: number): Promise<Cliente> {
    await wait()
    const c = db.find((x) => x.id === id)
    if (!c) throw new ApiError(404, 'NOT_FOUND', 'Cliente não encontrado')
    c.ativo = true
    return clone(c)
  },
  async inativar(id: number): Promise<Cliente> {
    await wait()
    const c = db.find((x) => x.id === id)
    if (!c) throw new ApiError(404, 'NOT_FOUND', 'Cliente não encontrado')
    c.ativo = false
    return clone(c)
  },
}
