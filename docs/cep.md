# Integração de CEP

Complementa o contrato em [`api.md`](api.md) (`GET /cep/:cep`), que continua sendo a fonte da verdade da API.

## Fluxo

```
Modal (CEP com 8 dígitos) → useCepLookup → GET /api/cep/:cep → services/cep.ts
                                                                 ├─ ViaCEP (3s)
                                                                 └─ BrasilAPI (3s), só se o ViaCEP falhar
```

## Backend

| Arquivo | Papel |
|---|---|
| `backend/src/routes/cep.ts` | Rota `GET /api/cep/:cep`. |
| `backend/src/services/cep.ts` | `buscarCep(cep)`: validação, consulta, fallback e normalização. |
| `backend/src/services/cep.test.ts` | Testes com `fetch` mockado. |
| `backend/src/lib/erros.ts` | Código `CEP_INDISPONIVEL` (502). |

### Regras

1. O CEP precisa ter 8 dígitos; senão, 400 `VALIDATION_ERROR` (`fields.cep`), sem chamar a rede.
2. Consulta `https://viacep.com.br/ws/{cep}/json/` com timeout de 3s.
3. O ViaCEP "falha" por erro de rede, timeout ou HTTP não-2xx. Nesse caso consulta `https://brasilapi.com.br/api/cep/v1/{cep}`, também com 3s.
4. Resposta do ViaCEP com `{"erro": true}` (ou 404 em qualquer provedor) é CEP inexistente: 404 `NOT_FOUND`. O ViaCEP responde isso com sucesso, então não aciona o fallback.
5. Os dois provedores falharam: 502 `CEP_INDISPONIVEL`.

### Normalização

| Saída | ViaCEP | BrasilAPI |
|---|---|---|
| `cep` | o CEP consultado (só dígitos) | idem |
| `endereco` | `logradouro` | `street` |
| `bairro` | `bairro` | `neighborhood` |
| `cidade` | `localidade` | `city` |
| `estado` | `uf` | `state` |

Campos ausentes viram `""` (CEPs genéricos de cidade pequena não têm logradouro nem bairro).

### Testes

`cd backend && npm test`. Cobrem sucesso, fallback (por erro e por 5xx), inexistente nos dois provedores, ambos fora do ar e CEP inválido.

## Frontend

| Arquivo | Papel |
|---|---|
| `frontend/src/hooks/useCepLookup.ts` | `useCepLookup(cep, enabled)` devolve `{ data, status }`. |
| `frontend/src/api/clientes.ts` | `consultarCep(cep, signal)`. |
| `frontend/src/components/ClienteModal.tsx` | Preenche os campos, move o foco e mostra o status. |

- **Gatilho:** ao chegar a 8 dígitos. Antes disso o estado é `idle`.
- **Status:** `idle`, `loading`, `notFound` (404) e `unavailable` (qualquer outro erro).
- **Cancelamento:** cada mudança de CEP aborta a requisição anterior (`AbortController`), então resposta obsoleta nunca preenche o formulário.
- **Preenchimento:** cidade, estado, endereço e bairro, que continuam editáveis. Campo que o provedor devolve vazio mantém o que o usuário já digitou. O foco vai para Número.
- **Mensagens:** "Buscando endereço…" com spinner; "CEP não encontrado…" e "Não foi possível consultar o CEP agora…". Nos dois erros o preenchimento manual segue liberado.
- **Edição:** se o CEP é o mesmo já salvo no cliente, não há consulta, para não sobrescrever o endereço dele.

## Limitações

- Com `VITE_USE_MOCK=true` a consulta de CEP ainda chama a API real (não há mock).
- Não há cache nem rate limit; cada CEP completo gera uma consulta.
