export interface CepResult {
  cep: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
}

/**
 * Ponto de extensão: consulta de CEP (GET /cep/:cep).
 * Recebe o CEP só com dígitos (completo ou não) e deve retornar os dados
 * de endereço quando encontrados, ou null. O modal preenche os campos
 * (continuam editáveis) sempre que o retorno mudar para um resultado não nulo.
 * Implementação pendente: outro agente.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCepLookup(_cep: string): CepResult | null {
  return null
}
