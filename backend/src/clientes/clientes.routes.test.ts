import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/erros';

vi.mock('./clientes.service');

import { createApp } from '../app';
import * as service from './clientes.service';

const app = createApp();

const valido = {
  nome: ' Maria Silva ',
  cpf: '123.456.789-09',
  telefone: '(11) 98765-4321',
  cep: '01310-100',
  cidade: 'São Paulo',
  estado: 'sp',
  endereco: 'Avenida Paulista',
  bairro: 'Bela Vista',
  numero: '1000',
};

beforeEach(() => vi.resetAllMocks());

describe('POST /api/clientes', () => {
  it('normaliza os dados e responde 201', async () => {
    vi.mocked(service.criar).mockResolvedValue({ id: 1 } as never);

    const res = await request(app).post('/api/clientes').send(valido);

    expect(res.status).toBe(201);
    expect(service.criar).toHaveBeenCalledWith({
      ...valido,
      nome: 'Maria Silva',
      cpf: '12345678909',
      telefone: '11987654321',
      cep: '01310100',
      estado: 'SP',
      complemento: null,
    });
  });

  it('retorna VALIDATION_ERROR com campos por input', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .send({ ...valido, cpf: '12345678900', telefone: '123', nome: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['cpf', 'nome', 'telefone']);
    expect(res.body.error.fields.cpf).toBe('CPF inválido');
    expect(service.criar).not.toHaveBeenCalled();
  });

  it('retorna CPF_DUPLICADO 409', async () => {
    vi.mocked(service.criar).mockRejectedValue(
      new AppError('CPF_DUPLICADO', 'CPF já cadastrado', { cpf: 'CPF já cadastrado' }),
    );

    const res = await request(app).post('/api/clientes').send(valido);

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      code: 'CPF_DUPLICADO',
      message: 'CPF já cadastrado',
      fields: { cpf: 'CPF já cadastrado' },
    });
  });
});

describe('GET /api/clientes/:id', () => {
  it('retorna NOT_FOUND 404', async () => {
    vi.mocked(service.buscar).mockRejectedValue(new AppError('NOT_FOUND', 'Cliente não encontrado'));

    const res = await request(app).get('/api/clientes/99');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Cliente não encontrado' } });
  });

  it('erro inesperado vira INTERNAL_ERROR sem vazar detalhes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.buscar).mockRejectedValue(new Error('select * from segredo'));

    const res = await request(app).get('/api/clientes/1');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('segredo');
  });
});

describe('GET /api/clientes', () => {
  it('usa ativo=true por padrão e rejeita valor inválido', async () => {
    vi.mocked(service.listar).mockResolvedValue([]);

    await request(app).get('/api/clientes?nome=ma');
    expect(service.listar).toHaveBeenCalledWith({ nome: 'ma', ativo: 'true' });

    const res = await request(app).get('/api/clientes?ativo=talvez');
    expect(res.status).toBe(400);
  });
});
