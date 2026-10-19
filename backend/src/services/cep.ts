import { AppError } from '../lib/erros';

export interface Endereco {
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const TIMEOUT_MS = 3000;

class CepInexistente extends Error {}

async function getJson(url: string): Promise<{ status: number; body: any }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { status: 200, body: await res.json() };
}

async function viaCep(cep: string): Promise<Endereco> {
  const { status, body } = await getJson(`https://viacep.com.br/ws/${cep}/json/`);
  if (status === 404 || body?.erro) throw new CepInexistente();
  return {
    cep,
    endereco: body.logradouro ?? '',
    bairro: body.bairro ?? '',
    cidade: body.localidade ?? '',
    estado: body.uf ?? '',
  };
}

async function brasilApi(cep: string): Promise<Endereco> {
  const { status, body } = await getJson(`https://brasilapi.com.br/api/cep/v1/${cep}`);
  if (status === 404) throw new CepInexistente();
  return {
    cep,
    endereco: body.street ?? '',
    bairro: body.neighborhood ?? '',
    cidade: body.city ?? '',
    estado: body.state ?? '',
  };
}

export async function buscarCep(cep: string): Promise<Endereco> {
  if (!/^\d{8}$/.test(cep)) {
    throw new AppError('VALIDATION_ERROR', 'Dados inválidos', { cep: 'CEP deve ter 8 dígitos' });
  }
  try {
    return await viaCep(cep);
  } catch (err) {
    if (err instanceof CepInexistente) throw new AppError('NOT_FOUND', 'CEP não encontrado');
  }
  try {
    return await brasilApi(cep);
  } catch (err) {
    if (err instanceof CepInexistente) throw new AppError('NOT_FOUND', 'CEP não encontrado');
    throw new AppError('CEP_INDISPONIVEL', 'Serviço de CEP indisponível. Preencha o endereço manualmente.');
  }
}
