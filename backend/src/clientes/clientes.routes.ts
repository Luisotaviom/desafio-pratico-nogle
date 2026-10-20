import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import * as controller from './clientes.controller';

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export const clientesRouter = Router();

clientesRouter.get('/', asyncHandler(controller.listar));
clientesRouter.get('/resumo', asyncHandler(controller.resumo));
clientesRouter.get('/:id', asyncHandler(controller.buscar));
clientesRouter.post('/', asyncHandler(controller.criar));
clientesRouter.put('/:id', asyncHandler(controller.atualizar));
clientesRouter.patch('/:id/inativar', asyncHandler(controller.inativar));
clientesRouter.patch('/:id/ativar', asyncHandler(controller.ativar));
