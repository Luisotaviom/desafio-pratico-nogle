import { describe, expect, it } from 'vitest';
import { cpfValido } from './cpf';

describe('cpfValido', () => {
  it('aceita CPFs com dígitos verificadores corretos', () => {
    expect(cpfValido('12345678909')).toBe(true);
    expect(cpfValido('52998224725')).toBe(true);
  });

  it('rejeita dígito verificador errado', () => {
    expect(cpfValido('12345678900')).toBe(false);
  });

  it('rejeita sequências repetidas', () => {
    expect(cpfValido('11111111111')).toBe(false);
    expect(cpfValido('00000000000')).toBe(false);
  });

  it('rejeita tamanho errado e não numéricos', () => {
    expect(cpfValido('1234567890')).toBe(false);
    expect(cpfValido('123.456.789-09')).toBe(false);
    expect(cpfValido('abcdefghijk')).toBe(false);
  });
});
