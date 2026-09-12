import type { Request, Response, NextFunction } from 'express';
import { listQueueService, getQueueMetricsService } from './queue.service.ts';
import validateQueueQuery from './queue.schemas.ts';
import type { QueueQuery } from '../../shared/types/queue.types.ts';

export const getMetricsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = await getQueueMetricsService();
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
}

export const centralizedQueue = async (req: Request, res: Response, next: NextFunction)  => {
  try {
    const parseResult = validateQueueQuery(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Parâmetros inválidos', details: parseResult.errors });
    }

    const filters = parseResult.data as QueueQuery;

    const result = await listQueueService(filters);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};