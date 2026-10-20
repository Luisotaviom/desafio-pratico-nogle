# Desafio prático Nogle

CRUD de clientes em tela única: cadastro, edição, inativação e reativação, com filtros por nome, CPF, estado e cidade e preenchimento automático de cidade/estado pelo CEP.

## Funcionalidades

- Modal de novo cliente e de edição (Salvar / Cancelar). Todos os campos são obrigatórios, exceto complemento.
- Filtros por **nome** e **CPF** (os do enunciado), mais **estado** (UF) e **cidade**. Combináveis, com debounce, e um botão para limpar todos.
- Contador no topo ("N clientes ativos · N inativos") vindo de `/clientes/resumo`, no mesmo recorte dos filtros.
- Tabela com nome, CPF, telefone e endereço completo, com ações **Editar**, **Inativar** e **Reativar**.
- Inativação lógica (`ativo = false`): não há DELETE físico. Clientes inativos continuam na lista, acinzentados e com selo "Inativo".
- Preenchimento de cidade, estado, endereço e bairro pelo CEP (ViaCEP, com BrasilAPI como fallback). Os campos continuam editáveis e, se a consulta falhar, o preenchimento manual segue liberado.
- Validação de CPF (dígitos verificadores) e unicidade, no backend e no frontend.
- Linha salva ou reativada fica destacada por instantes. Cancelar um modal com dados digitados pede confirmação antes de descartar.
- Tela responsiva: a tabela vira cards no mobile.
- Estados de loading e vazio, validação inline, feedback de sucesso e erro, foco e teclado acessíveis nos modais.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js, Express 5, TypeScript, Zod (validação) |
| Banco | PostgreSQL com Drizzle ORM (`drizzle-kit` para migrations) |
| Frontend | React 19, Vite, TypeScript, CSS puro |
| API de CEP (externa) | [ViaCEP](https://viacep.com.br) (`https://viacep.com.br/ws/{cep}/json/`) como principal e [BrasilAPI](https://brasilapi.com.br) (`https://brasilapi.com.br/api/cep/v1/{cep}`) como fallback, com timeout de 3s cada. O backend expõe `GET /api/cep/:cep` e o frontend nunca chama os provedores direto. |
| Testes | Vitest e Supertest (backend); Vitest (frontend) |

## Estrutura

```
backend/    API REST (Express + Drizzle)
frontend/   Interface React (Vite)
database/   schema.sql (script de criação das tabelas)
            migrations/ (gerado pelo drizzle-kit)
docs/       api.md (contrato da API) e cep.md (integração de CEP)
```

## Como rodar

Pré-requisitos: Node.js e PostgreSQL (ou Docker).

### 1. Banco

Com PostgreSQL instalado:

```bash
createdb nogle
psql nogle -f database/schema.sql
```

Ou com Docker (não precisa de `psql` na máquina):

```bash
docker run -d --name nogle-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nogle -p 5432:5432 postgres:17-alpine
docker exec -i nogle-pg psql -U postgres -d nogle < database/schema.sql
```

Para parar e religar depois: `docker stop nogle-pg` e `docker start nogle-pg` (os dados ficam no container).

### 2. Backend

```bash
cd backend
cp .env.example .env      # ajuste DATABASE_URL se necessário
npm install
npm run dev               # http://localhost:3333/api
```

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/nogle` | Conexão com o PostgreSQL |
| `PORT` | `3333` | Porta da API |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem permitida no CORS |
| `TEST_DATABASE_URL` | (vazio) | Opcional: banco descartável para os testes de integração |

Scripts: `npm run dev` (watch), `npm run build`, `npm start`, `npm test`, `npm run db:generate` (gera migration a partir do schema Drizzle).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3333/api` | URL base da API |
| `VITE_USE_MOCK` | `false` no `.env.example` | `false` usa a API real (backend e banco rodando). `true` usa dados em memória, útil para ver a interface sem backend |

Scripts: `npm run dev`, `npm run build` (checagem de tipos + build), `npm run preview`, `npm test`.

## API

Base URL `http://localhost:3333/api`, JSON em tudo. CPF, telefone e CEP trafegam **somente com dígitos**; a máscara é feita no frontend. O contrato completo (formatos, validações e erros) está em [`docs/api.md`](docs/api.md).

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/clientes?nome=&cpf=&estado=&cidade=&ativo=` | Lista com filtros combináveis. `ativo`: `true` (padrão), `false` ou `all` | 200 |
| GET | `/clientes/resumo?nome=&cpf=&estado=&cidade=` | Contadores `{ ativos, inativos, total }` com os mesmos filtros | 200 |
| GET | `/clientes/:id` | Busca um cliente | 200 |
| POST | `/clientes` | Cria | 201 |
| PUT | `/clientes/:id` | Edita | 200 |
| PATCH | `/clientes/:id/inativar` | Inativação lógica | 200 |
| PATCH | `/clientes/:id/ativar` | Reativa (idempotente) | 200 |
| GET | `/cep/:cep` | Consulta CEP (ViaCEP, fallback BrasilAPI) | 200 |

Erros seguem um formato único:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos", "fields": { "cpf": "CPF inválido" } } }
```

| Código | HTTP | Quando |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Dados inválidos (`fields` indica o campo) |
| `NOT_FOUND` | 404 | Cliente, CEP ou rota inexistente |
| `CPF_DUPLICADO` | 409 | CPF já cadastrado |
| `CEP_INDISPONIVEL` | 502 | Os dois provedores de CEP falharam |
| `INTERNAL_ERROR` | 500 | Erro inesperado |

## Banco de dados

Tabela única, `clientes`. O script oficial é [`database/schema.sql`](database/schema.sql) e deve ficar igual ao schema Drizzle (`backend/src/db/schema.ts`).

| Coluna | Tipo | Regra |
|---|---|---|
| `id` | `integer` identity | PK, `GENERATED ALWAYS` |
| `nome` | `text` | obrigatório, 1 a 150 caracteres |
| `cpf` | `text` | obrigatório, único, 11 dígitos |
| `telefone` | `text` | obrigatório, 10 ou 11 dígitos (DDD + número) |
| `cep` | `text` | obrigatório, 8 dígitos |
| `cidade` | `text` | obrigatório, até 100 |
| `estado` | `text` | obrigatório, UF com 2 letras maiúsculas |
| `endereco` | `text` | obrigatório, até 200 |
| `bairro` | `text` | obrigatório, até 100 |
| `numero` | `text` | obrigatório, até 20 |
| `complemento` | `text` | opcional, até 100 |
| `ativo` | `boolean` | padrão `true` |
| `criado_em` / `atualizado_em` | `timestamptz` | padrão `now()` |

Índice: `idx_clientes_nome` em `LOWER(nome)`, para o filtro por nome. As regras ficam também como `CHECK` no banco, então dados inválidos são barrados mesmo fora da API.

## Backend

```
backend/src/
  app.ts                 Express, CORS, rotas e handler de erros
  server.ts              Sobe o servidor
  clientes/              routes → controller → service, mais schema Zod e testes
  routes/cep.ts          GET /api/cep/:cep
  services/cep.ts        ViaCEP com fallback BrasilAPI (timeout de 3s cada)
  lib/cpf.ts             Validação de CPF
  lib/erros.ts           AppError e códigos de erro
  db/                    Conexão (pg Pool) e schema Drizzle
```

- Camadas: rota → controller (HTTP) → service (regra e acesso ao banco via Drizzle).
- Validação de entrada com Zod; erros viram o formato único da API.
- Detalhes da integração de CEP em [`docs/cep.md`](docs/cep.md).

## Frontend

```
frontend/src/
  App.tsx                    Estado da tela, filtros, toasts e ações
  api/clientes.ts            Cliente HTTP (ApiError) e consulta de CEP
  api/mock.ts                API em memória (VITE_USE_MOCK=true)
  components/                ClienteLista, ClienteModal, ConfirmInativar, Dialog, Field
  hooks/                     useCepLookup (com AbortController), useDebounce
  lib/format.ts              Máscaras de CPF, telefone e CEP, endereço completo, lista de UFs
  lib/validation.ts          Validação do formulário (inclui CPF)
  lib/*.test.ts              Testes de máscaras e validação (Vitest)
  styles.css                 Tema e layout responsivo
```

- Máscaras só na interface; para a API vão apenas os dígitos.
- Consulta de CEP dispara ao completar 8 dígitos e cancela a requisição anterior a cada mudança.
- Com o mock ligado, a interface funciona sem backend (a consulta de CEP ainda chama a API real).

## Testes

```bash
cd backend && npm test
```

- **Unitários** (sem banco): rotas de clientes (com o service mockado), validação de CPF e serviço de CEP (sucesso, fallback, CEP inexistente, provedores fora do ar e CEP inválido).
- **Integração** (PostgreSQL real): criar, editar, CPF duplicado (409), inativar/reativar, 404 e filtros (nome, CPF, estado, cidade, resumo). Rodam só quando `TEST_DATABASE_URL` está definido, e **recriam a tabela `clientes`**, então use um banco descartável:

```bash
docker exec nogle-pg psql -U postgres -c "CREATE DATABASE nogle_test"
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/nogle_test npm test
```

Sem a variável, esses testes são pulados. O frontend tem os seus em `cd frontend && npm test`.
