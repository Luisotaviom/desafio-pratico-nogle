-- Schema do desafio Nogle: cadastro de clientes.
-- Uso: psql "$DATABASE_URL" -f database/schema.sql

CREATE TABLE IF NOT EXISTS clientes (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          TEXT        NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 150),
  cpf           TEXT        NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$'),        -- somente dígitos
  telefone      TEXT        NOT NULL CHECK (telefone ~ '^[0-9]{10,11}$'),       -- somente dígitos (DDD + número)
  cep           TEXT        NOT NULL CHECK (cep ~ '^[0-9]{8}$'),                -- somente dígitos
  cidade        TEXT        NOT NULL CHECK (char_length(cidade) BETWEEN 1 AND 100),
  estado        TEXT        NOT NULL CHECK (estado ~ '^[A-Z]{2}$'),             -- UF
  endereco      TEXT        NOT NULL CHECK (char_length(endereco) BETWEEN 1 AND 200),
  bairro        TEXT        NOT NULL CHECK (char_length(bairro) BETWEEN 1 AND 100),
  numero        TEXT        NOT NULL CHECK (char_length(numero) BETWEEN 1 AND 20),
  complemento   TEXT        CHECK (char_length(complemento) <= 100),
  ativo         BOOLEAN     NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (LOWER(nome));
