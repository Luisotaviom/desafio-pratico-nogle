// Testa a API contra um PostgreSQL real. Roda só com TEST_DATABASE_URL definido
// (aponte para um banco descartável: a tabela clientes é recriada a cada execução).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

const base = {
  nome: 'Maria Silva',
  cpf: '52998224725',
  telefone: '11987654321',
  cep: '01310100',
  cidade: 'São Paulo',
  estado: 'SP',
  endereco: 'Avenida Paulista',
  bairro: 'Bela Vista',
  numero: '1000',
};

describe.skipIf(!url)('clientes (PostgreSQL real)', () => {
  let pool: Pool;
  let app: ReturnType<typeof import('../app').createApp>;

  beforeAll(async () => {
    process.env.DATABASE_URL = url; // antes de importar o módulo db
    pool = new Pool({ connectionString: url });
    await pool.query('DROP TABLE IF EXISTS clientes');
    await pool.query(readFileSync(resolve(__dirname, '../../../database/schema.sql'), 'utf8'));
    app = (await import('../app')).createApp();
  });

  beforeEach(() => pool.query('TRUNCATE clientes RESTART IDENTITY'));

  afterAll(async () => {
    await pool?.end();
  });

  const criar = (dados: Partial<typeof base> = {}) =>
    request(app).post('/api/clientes').send({ ...base, ...dados });

  it('cria, busca e edita um cliente', async () => {
    const criado = await criar({ complemento: 'Apto 12' } as never);
    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({ id: 1, ...base, complemento: 'Apto 12', ativo: true });

    expect((await request(app).get('/api/clientes/1')).body.nome).toBe('Maria Silva');

    const editado = await request(app)
      .put('/api/clientes/1')
      .send({ ...base, nome: 'Maria Souza' });
    expect(editado.status).toBe(200);
    expect(editado.body.nome).toBe('Maria Souza');
    expect(editado.body.complemento).toBeNull();
  });

  it('atualiza atualizado_em no PUT', async () => {
    await criar();
    const antes = (await pool.query('SELECT atualizado_em FROM clientes')).rows[0].atualizado_em;
    await new Promise((r) => setTimeout(r, 20));
    await request(app).put('/api/clientes/1').send({ ...base, nome: 'Outra' });
    const depois = (await pool.query('SELECT atualizado_em FROM clientes')).rows[0].atualizado_em;
    expect(depois.getTime()).toBeGreaterThan(antes.getTime());
  });

  it('retorna 409 CPF_DUPLICADO na criação e na edição', async () => {
    await criar();
    const dup = await criar({ nome: 'Outro' });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatchObject({ code: 'CPF_DUPLICADO', fields: { cpf: expect.any(String) } });

    // o insert duplicado consome um valor da identity, então o id vem da resposta
    const { body: joao } = await criar({ cpf: '12345678909', nome: 'João' });
    const edicao = await request(app).put(`/api/clientes/${joao.id}`).send({ ...base, nome: 'João' });
    expect(edicao.status).toBe(409);
  });

  it('inativa e reativa sem apagar a linha', async () => {
    await criar();

    expect((await request(app).patch('/api/clientes/1/inativar')).body.ativo).toBe(false);
    expect((await request(app).get('/api/clientes')).body).toHaveLength(0);
    expect((await request(app).get('/api/clientes?ativo=false')).body).toHaveLength(1);
    expect((await request(app).get('/api/clientes?ativo=all')).body).toHaveLength(1);

    expect((await request(app).patch('/api/clientes/1/ativar')).body.ativo).toBe(true);
    expect((await request(app).patch('/api/clientes/1/ativar')).status).toBe(200);
    expect((await pool.query('SELECT count(*)::int AS n FROM clientes')).rows[0].n).toBe(1);
  });

  it('retorna 404 para id inexistente', async () => {
    for (const req of [
      request(app).get('/api/clientes/99'),
      request(app).put('/api/clientes/99').send(base),
      request(app).patch('/api/clientes/99/inativar'),
      request(app).patch('/api/clientes/99/ativar'),
    ]) {
      const res = await req;
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    }
  });

  describe('filtros', () => {
    beforeEach(async () => {
      await criar({ nome: 'Maria Silva', cpf: '52998224725' });
      await criar({ nome: 'José Maria', cpf: '12345678909', cidade: 'Campinas' });
      await criar({ nome: 'Ana Costa', cpf: '11144477735', cidade: 'Porto Alegre', estado: 'RS' });
      await request(app).patch('/api/clientes/3/inativar');
    });

    const nomes = async (qs: string) =>
      (await request(app).get(`/api/clientes?${qs}`)).body.map((c: { nome: string }) => c.nome);

    it('nome contém, sem diferenciar maiúsculas, e trata % literalmente', async () => {
      expect(await nomes('nome=MARIA')).toEqual(['José Maria', 'Maria Silva']);
      expect(await nomes('nome=%25')).toEqual([]);
    });

    it('cpf contém, ignorando máscara', async () => {
      expect(await nomes('cpf=529.982')).toEqual(['Maria Silva']);
    });

    it('estado e cidade, combinados com ativo', async () => {
      expect(await nomes('estado=rs&ativo=all')).toEqual(['Ana Costa']);
      expect(await nomes('estado=RS')).toEqual([]);
      expect(await nomes('cidade=campi')).toEqual(['José Maria']);
    });

    it('combina nome + cidade', async () => {
      expect(await nomes('nome=maria&cidade=campinas')).toEqual(['José Maria']);
    });

    it('resumo conta ativos e inativos com os mesmos filtros', async () => {
      expect((await request(app).get('/api/clientes/resumo')).body).toEqual({ ativos: 2, inativos: 1, total: 3 });
      expect((await request(app).get('/api/clientes/resumo?estado=RS')).body).toEqual({
        ativos: 0,
        inativos: 1,
        total: 1,
      });
    });
  });
});
