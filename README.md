# Desafio prático Nogle

CRUD de clientes em tela única: cadastro, edição e inativação, com filtros por nome e CPF.

## Stack

- **Backend:** Node.js (Express) + PostgreSQL
- **Frontend:** React (Vite)
- **CEP:** ViaCEP, com BrasilAPI como fallback ([detalhes](docs/cep.md))

## Estrutura

```
backend/    API REST
frontend/   Interface React
database/   Scripts de criação das tabelas
```

## Como rodar

1. Crie o banco e aplique o schema:
   ```bash
   createdb nogle
   psql nogle -f database/schema.sql
   ```
2. Backend e frontend: instruções serão adicionadas conforme a implementação.

## Requisitos do desafio

- [ ] Modal de novo cliente (Salvar / Cancelar), campos obrigatórios exceto complemento
- [ ] Filtros por Nome e CPF
- [ ] Tabela: Nome, CPF, Telefone, Endereço completo, com Editar e Inativar
- [ ] Tela responsiva
- [ ] Preenchimento automático de cidade e estado pelo CEP
- [ ] Vídeo de demonstração
