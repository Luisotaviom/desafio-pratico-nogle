export interface Cliente {
  id: number
  nome: string
  cpf: string
  telefone: string
  cep: string
  cidade: string
  estado: string
  endereco: string
  bairro: string
  numero: string
  complemento: string | null
  ativo: boolean
}

export type ClienteInput = Omit<Cliente, 'id' | 'ativo'>

export interface ClienteFiltros {
  nome: string
  cpf: string
}

export type FieldErrors = Partial<Record<keyof ClienteInput, string>>
