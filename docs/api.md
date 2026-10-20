# Contrato da API

Base URL: `http://localhost:3333/api`. JSON em tudo. Este arquivo é a fonte da verdade:
backend e frontend não o alteram (mudanças só pela `main`).

## Formatos

- CPF, telefone e CEP trafegam **somente com dígitos** (`"12345678909"`). A formatação visual é feita no frontend.
- `estado` é a UF com 2 letras maiúsculas.
- `complemento` é o único campo opcional (`null` ou ausente).

### Cliente

```json
{
  "id": 1,
  "nome": "Maria Silva",
  "cpf": "12345678909",
  "telefone": "11987654321",
  "cep": "01310100",
  "cidade": "São Paulo",
  "estado": "SP",
  "endereco": "Avenida Paulista",
  "bairro": "Bela Vista",
  "numero": "1000",
  "complemento": "Apto 12",
  "ativo": true
}
```

### Erro (qualquer status 4xx/5xx)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos", "fields": { "cpf": "CPF inválido" } } }
```

`code`: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `CPF_DUPLICADO` (409), `INTERNAL_ERROR` (500).
`fields` só existe em `VALIDATION_ERROR` e `CPF_DUPLICADO` (`{ "cpf": "..." }`).

## Rotas

| Método | Rota | Descrição | Sucesso |
|---|---|---|---|
| GET | `/clientes?nome=&cpf=&estado=&cidade=&ativo=` | Lista. `nome`: contém, sem diferenciar maiúsculas. `cpf`: contém, só dígitos. `estado`: UF exata (2 letras, aceita minúsculas). `cidade`: contém, sem diferenciar maiúsculas. `ativo`: `true` (padrão), `false` ou `all`. Filtros combinam (E) | 200 `Cliente[]` |
| GET | `/clientes/resumo?nome=&cpf=&estado=&cidade=` | Contadores com os mesmos filtros da lista (sem `ativo`) | 200 `{ ativos, inativos, total }` |
| GET | `/clientes/:id` | Busca um | 200 `Cliente` |
| POST | `/clientes` | Cria (sem `id` e `ativo`) | 201 `Cliente` |
| PUT | `/clientes/:id` | Edita todos os campos editáveis | 200 `Cliente` |
| PATCH | `/clientes/:id/inativar` | Inativação lógica (`ativo=false`) | 200 `Cliente` |
| PATCH | `/clientes/:id/ativar` | Reativa o cliente (`ativo=true`); idempotente | 200 `Cliente` |
| GET | `/cep/:cep` | Consulta CEP (ViaCEP, fallback BrasilAPI) | 200 `{ cep, endereco, bairro, cidade, estado }` |

Regras de validação (POST/PUT): todos os campos obrigatórios exceto `complemento`; CPF com dígitos verificadores
válidos e único; telefone com 10 ou 11 dígitos; CEP com 8 dígitos; estado com 2 letras.

`GET /cep/:cep`: CEP inválido → 400 `VALIDATION_ERROR`; CEP inexistente → 404 `NOT_FOUND`; provedores fora do ar → 502
`{ "error": { "code": "CEP_INDISPONIVEL", "message": "..." } }` (o usuário ainda pode preencher à mão).
