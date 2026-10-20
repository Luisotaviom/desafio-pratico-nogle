import { z } from 'zod';
import { cpfValido, somenteDigitos } from '../lib/cpf';

const texto = (campo: string, max: number) =>
  z
    .string({ error: `${campo} é obrigatório` })
    .trim()
    .min(1, `${campo} é obrigatório`)
    .max(max, `${campo} deve ter no máximo ${max} caracteres`);

const digitos = (valor: unknown) => (typeof valor === 'string' ? somenteDigitos(valor) : valor);

export const clienteInputSchema = z.object({
  nome: texto('Nome', 150),
  cpf: z.preprocess(
    digitos,
    z
      .string({ error: 'CPF é obrigatório' })
      .refine(cpfValido, 'CPF inválido'),
  ),
  telefone: z.preprocess(
    digitos,
    z
      .string({ error: 'Telefone é obrigatório' })
      .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  ),
  cep: z.preprocess(
    digitos,
    z.string({ error: 'CEP é obrigatório' }).regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  ),
  cidade: texto('Cidade', 100),
  estado: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toUpperCase() : v),
    z.string({ error: 'Estado é obrigatório' }).regex(/^[A-Z]{2}$/, 'Estado deve ter 2 letras'),
  ),
  endereco: texto('Endereço', 200),
  bairro: texto('Bairro', 100),
  numero: texto('Número', 20),
  complemento: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string()
      .trim()
      .max(100, 'Complemento deve ter no máximo 100 caracteres')
      .nullish()
      .transform((v) => v ?? null),
  ),
});

export type ClienteInput = z.infer<typeof clienteInputSchema>;

const filtrosSchema = z.object({
  nome: z.string().trim().optional(),
  cpf: z.string().optional(),
  estado: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toUpperCase() || undefined : v),
    z.string().regex(/^[A-Z]{2}$/, 'estado deve ter 2 letras').optional(),
  ),
  cidade: z.string().trim().optional(),
});

export const listaQuerySchema = filtrosSchema.extend({
  ativo: z.enum(['true', 'false', 'all'], { error: 'ativo deve ser true, false ou all' }).default('true'),
});

export const resumoQuerySchema = filtrosSchema;

export type Filtros = z.infer<typeof filtrosSchema>;
export type ListaQuery = z.infer<typeof listaQuerySchema>;

export const idSchema = z.coerce.number().int().positive();
