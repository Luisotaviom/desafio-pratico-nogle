import type { Request, Response } from 'express';
import { AppError } from '../lib/erros';
import { clienteInputSchema, idSchema, listaQuerySchema } from './clientes.schema';
import * as service from './clientes.service';
import type { ZodError } from 'zod';

function camposDoErro(error: ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || '_';
    campos[campo] ??= issue.message;
  }
  return campos;
}

function validar<T>(result: { success: true; data: T } | { success: false; error: ZodError }): T {
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', 'Dados inválidos', camposDoErro(result.error));
  }
  return result.data;
}

function lerId(req: Request): number {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) throw new AppError('NOT_FOUND', 'Cliente não encontrado');
  return parsed.data;
}

export async function listar(req: Request, res: Response) {
  const query = validar(listaQuerySchema.safeParse(req.query));
  res.json(await service.listar(query));
}

export async function buscar(req: Request, res: Response) {
  res.json(await service.buscar(lerId(req)));
}

export async function criar(req: Request, res: Response) {
  const dados = validar(clienteInputSchema.safeParse(req.body ?? {}));
  res.status(201).json(await service.criar(dados));
}

export async function atualizar(req: Request, res: Response) {
  const id = lerId(req);
  const dados = validar(clienteInputSchema.safeParse(req.body ?? {}));
  res.json(await service.atualizar(id, dados));
}

export async function inativar(req: Request, res: Response) {
  res.json(await service.inativar(lerId(req)));
}

export async function ativar(req: Request, res: Response) {
  res.json(await service.ativar(lerId(req)));
}
