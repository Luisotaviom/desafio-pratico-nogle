import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscarCep } from './cep';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const viaCepOk = {
  cep: '01310-100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP',
};
const brasilOk = {
  cep: '01310100', street: 'Avenida Paulista', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP',
};
const esperado = {
  cep: '01310100', endereco: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP',
};

function mockFetch(...respostas: Array<Response | Error>) {
  const fn = vi.fn();
  for (const r of respostas) r instanceof Error ? fn.mockRejectedValueOnce(r) : fn.mockResolvedValueOnce(r);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('buscarCep', () => {
  it('normaliza a resposta do ViaCEP', async () => {
    const fn = mockFetch(json(viaCepOk));
    expect(await buscarCep('01310100')).toEqual(esperado);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0]).toBe('https://viacep.com.br/ws/01310100/json/');
  });

  it('cai no BrasilAPI quando o ViaCEP falha', async () => {
    const fn = mockFetch(new Error('timeout'), json(brasilOk));
    expect(await buscarCep('01310100')).toEqual(esperado);
    expect(fn.mock.calls[1][0]).toBe('https://brasilapi.com.br/api/cep/v1/01310100');
  });

  it('cai no BrasilAPI quando o ViaCEP responde 5xx', async () => {
    mockFetch(json({}, 503), json(brasilOk));
    expect(await buscarCep('01310100')).toEqual(esperado);
  });

  it('CEP inexistente no ViaCEP ({"erro": true}) → NOT_FOUND sem consultar o fallback', async () => {
    const fn = mockFetch(json({ erro: true }));
    await expect(buscarCep('99999999')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('CEP inexistente no BrasilAPI (404) → NOT_FOUND', async () => {
    mockFetch(new Error('fora'), json({}, 404));
    await expect(buscarCep('99999999')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('ambos fora do ar → CEP_INDISPONIVEL (502)', async () => {
    mockFetch(new Error('fora'), json({}, 500));
    await expect(buscarCep('01310100')).rejects.toMatchObject({ code: 'CEP_INDISPONIVEL', status: 502 });
  });

  it('CEP inválido → VALIDATION_ERROR sem chamar a rede', async () => {
    const fn = mockFetch();
    await expect(buscarCep('123')).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    expect(fn).not.toHaveBeenCalled();
  });
});
