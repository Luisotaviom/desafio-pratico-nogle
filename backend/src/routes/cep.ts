import { Router } from 'express';
import { buscarCep } from '../services/cep';

export const cepRouter = Router();

cepRouter.get('/:cep', async (req, res) => {
  res.json(await buscarCep(req.params.cep));
});
