import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { clientesRouter } from './clientes/clientes.routes';
import { AppError } from './lib/erros';
import { cepRouter } from './routes/cep';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'JSON inválido', fields: {} } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
};

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json());

  app.use('/api/clientes', clientesRouter);
  app.use('/api/cep', cepRouter);

  app.use((_req, _res, next) => next(new AppError('NOT_FOUND', 'Rota não encontrada')));
  app.use(errorHandler);
  return app;
}
