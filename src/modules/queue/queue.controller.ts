import type { Request, Response, NextFunction } from 'express';
import { listQueueService } from './queue.service.ts';
import type {GetQueueQuery} from '../DTOs/queue/queue.dto.ts';

export const centralizedQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, priority, assigneeId, unassigned, page, pageSize } = req.query;

    const parsedPage = page ? Number(page) : 1;
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ error: 'O parâmetro "page" deve ser um número inteiro maior ou igual a 1.' });
    }

    const parsedPageSize = pageSize ? Number(pageSize) : 5;
    if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
      return res.status(400).json({ error: 'O parâmetro "pageSize" deve ser um número entre 1 e 100.' });
    }


    const filters: GetQueueQuery = {
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      priority: priority ? String(priority) : undefined,
      assigneeId: assigneeId ? String(assigneeId) : undefined,
      unassigned: unassigned === 'true',
      page: parsedPage,
      pageSize: parsedPageSize,
    };

    const result = await listQueueService(filters);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};