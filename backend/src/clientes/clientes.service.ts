import { and, eq, ilike, sql, type SQL } from 'drizzle-orm';
import { db } from '../db';
import { clientes } from '../db/schema';
import { AppError } from '../lib/erros';
import { somenteDigitos } from '../lib/cpf';
import type { ClienteInput, Filtros, ListaQuery } from './clientes.schema';

const colunas = {
  id: clientes.id,
  nome: clientes.nome,
  cpf: clientes.cpf,
  telefone: clientes.telefone,
  cep: clientes.cep,
  cidade: clientes.cidade,
  estado: clientes.estado,
  endereco: clientes.endereco,
  bairro: clientes.bairro,
  numero: clientes.numero,
  complemento: clientes.complemento,
  ativo: clientes.ativo,
};

const escapeLike = (v: string) => v.replace(/[\\%_]/g, '\\$&');

function violacaoUnique(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

function traduzirErro(err: unknown): never {
  if (violacaoUnique(err)) {
    throw new AppError('CPF_DUPLICADO', 'CPF já cadastrado', { cpf: 'CPF já cadastrado' });
  }
  throw err;
}

function naoEncontrado(): never {
  throw new AppError('NOT_FOUND', 'Cliente não encontrado');
}

function filtrosDe({ nome, cpf, estado, cidade }: Filtros): SQL[] {
  const filtros: SQL[] = [];
  if (nome) filtros.push(ilike(clientes.nome, `%${escapeLike(nome)}%`));
  const cpfDigitos = cpf ? somenteDigitos(cpf) : '';
  if (cpfDigitos) filtros.push(ilike(clientes.cpf, `%${cpfDigitos}%`));
  if (estado) filtros.push(eq(clientes.estado, estado));
  if (cidade) filtros.push(ilike(clientes.cidade, `%${escapeLike(cidade)}%`));
  return filtros;
}

export async function listar({ ativo, ...filtros }: ListaQuery) {
  const condicoes = filtrosDe(filtros);
  if (ativo !== 'all') condicoes.push(eq(clientes.ativo, ativo === 'true'));

  return db
    .select(colunas)
    .from(clientes)
    .where(and(...condicoes))
    .orderBy(sql`lower(${clientes.nome})`, clientes.id);
}

export async function resumo(filtros: Filtros) {
  const [linha] = await db
    .select({
      ativos: sql<number>`count(*) filter (where ${clientes.ativo})::int`,
      inativos: sql<number>`count(*) filter (where not ${clientes.ativo})::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(clientes)
    .where(and(...filtrosDe(filtros)));
  return linha;
}

export async function buscar(id: number) {
  const [cliente] = await db.select(colunas).from(clientes).where(eq(clientes.id, id));
  return cliente ?? naoEncontrado();
}

export async function criar(dados: ClienteInput) {
  try {
    const [cliente] = await db.insert(clientes).values(dados).returning(colunas);
    return cliente;
  } catch (err) {
    return traduzirErro(err);
  }
}

export async function atualizar(id: number, dados: ClienteInput) {
  try {
    const [cliente] = await db
      .update(clientes)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(clientes.id, id))
      .returning(colunas);
    return cliente ?? naoEncontrado();
  } catch (err) {
    return traduzirErro(err);
  }
}

async function definirAtivo(id: number, ativo: boolean) {
  const [cliente] = await db
    .update(clientes)
    .set({ ativo, atualizadoEm: new Date() })
    .where(eq(clientes.id, id))
    .returning(colunas);
  return cliente ?? naoEncontrado();
}

export const inativar = (id: number) => definirAtivo(id, false);

export const ativar = (id: number) => definirAtivo(id, true);
