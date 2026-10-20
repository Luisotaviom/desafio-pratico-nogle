import { describe, expect, it } from 'vitest'
import { enderecoCompleto, maskCep, maskCpf, maskTelefone, onlyDigits } from './format'

describe('máscaras', () => {
  it('extrai só dígitos', () => expect(onlyDigits('529.982.247-25')).toBe('52998224725'))
  it('mascara CPF progressivamente', () => {
    expect(maskCpf('529')).toBe('529')
    expect(maskCpf('5299822')).toBe('529.982.2')
    expect(maskCpf('52998224725999')).toBe('529.982.247-25')
  })
  it('mascara telefone fixo e celular', () => {
    expect(maskTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(maskTelefone('11987654321')).toBe('(11) 98765-4321')
  })
  it('mascara CEP', () => {
    expect(maskCep('01310')).toBe('01310')
    expect(maskCep('01310100')).toBe('01310-100')
  })
})

describe('enderecoCompleto', () => {
  const base = { endereco: 'Avenida Paulista', numero: '1000', complemento: null, bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', cep: '01310100' }
  it('monta sem complemento', () => {
    expect(enderecoCompleto(base)).toBe('Avenida Paulista, 1000 – Bela Vista, São Paulo/SP – CEP 01310-100')
  })
  it('inclui complemento', () => {
    expect(enderecoCompleto({ ...base, complemento: 'Apto 12' })).toContain('1000 – Apto 12 – Bela Vista')
  })
})
