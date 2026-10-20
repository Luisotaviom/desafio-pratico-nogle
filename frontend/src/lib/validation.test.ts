import { describe, expect, it } from 'vitest'
import type { ClienteInput } from '../types'
import { isValidCpf, validateAll, validateField } from './validation'

const ok: ClienteInput = {
  nome: 'Maria Silva', cpf: '529.982.247-25', telefone: '(11) 98765-4321', cep: '01310-100',
  cidade: 'São Paulo', estado: 'SP', endereco: 'Avenida Paulista', bairro: 'Bela Vista', numero: '1000', complemento: '',
}

describe('isValidCpf', () => {
  it('aceita CPF válido com ou sem máscara', () => {
    expect(isValidCpf('52998224725')).toBe(true)
    expect(isValidCpf('529.982.247-25')).toBe(true)
  })
  it('rejeita dígito verificador errado, repetidos e tamanho', () => {
    expect(isValidCpf('52998224726')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('123')).toBe(false)
  })
})

describe('validação do formulário', () => {
  it('não tem erros com dados válidos (complemento opcional)', () => {
    expect(validateAll(ok)).toEqual({})
  })
  it('exige os campos obrigatórios', () => {
    const erros = validateAll({ ...ok, nome: '  ', numero: '' })
    expect(erros.nome).toBe('Campo obrigatório')
    expect(erros.numero).toBe('Campo obrigatório')
  })
  it('valida telefone, CEP e UF', () => {
    expect(validateField('telefone', { ...ok, telefone: '(11) 9876' })).toMatch(/10 ou 11/)
    expect(validateField('cep', { ...ok, cep: '01310' })).toMatch(/8 dígitos/)
    expect(validateField('estado', { ...ok, estado: 'S' })).toMatch(/2 letras/)
  })
})
