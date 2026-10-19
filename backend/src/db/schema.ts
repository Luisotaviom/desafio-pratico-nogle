import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const clientes = pgTable(
  'clientes',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nome: text().notNull(),
    cpf: text().notNull().unique(),
    telefone: text().notNull(),
    cep: text().notNull(),
    cidade: text().notNull(),
    estado: text().notNull(),
    endereco: text().notNull(),
    bairro: text().notNull(),
    numero: text().notNull(),
    complemento: text(),
    ativo: boolean().notNull().default(true),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('clientes_nome_check', sql`char_length(${t.nome}) BETWEEN 1 AND 150`),
    check('clientes_cpf_check', sql`${t.cpf} ~ '^[0-9]{11}$'`),
    check('clientes_telefone_check', sql`${t.telefone} ~ '^[0-9]{10,11}$'`),
    check('clientes_cep_check', sql`${t.cep} ~ '^[0-9]{8}$'`),
    check('clientes_cidade_check', sql`char_length(${t.cidade}) BETWEEN 1 AND 100`),
    check('clientes_estado_check', sql`${t.estado} ~ '^[A-Z]{2}$'`),
    check('clientes_endereco_check', sql`char_length(${t.endereco}) BETWEEN 1 AND 200`),
    check('clientes_bairro_check', sql`char_length(${t.bairro}) BETWEEN 1 AND 100`),
    check('clientes_numero_check', sql`char_length(${t.numero}) BETWEEN 1 AND 20`),
    check('clientes_complemento_check', sql`char_length(${t.complemento}) <= 100`),
    index('idx_clientes_nome').on(sql`LOWER(${t.nome})`),
  ],
);
