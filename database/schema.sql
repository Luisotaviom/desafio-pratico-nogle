-- Desafio prático Nogle: criação das tabelas (PostgreSQL)

CREATE TABLE IF NOT EXISTS clientes (
    id           SERIAL PRIMARY KEY,
    nome         VARCHAR(150) NOT NULL,
    cpf          CHAR(11)     NOT NULL UNIQUE,
    telefone     VARCHAR(15)  NOT NULL,
    cep          CHAR(8)      NOT NULL,
    cidade       VARCHAR(100) NOT NULL,
    estado       CHAR(2)      NOT NULL,
    endereco     VARCHAR(200) NOT NULL,
    bairro       VARCHAR(100) NOT NULL,
    numero       VARCHAR(10)  NOT NULL,
    complemento  VARCHAR(100),
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (LOWER(nome));
