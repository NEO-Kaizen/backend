import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { getQueueMetricsService, listQueueService } from "./queue.service.ts";
import { queueQuerySchema } from "./queue.schemas.ts";

export const getMetricsController = async (req: Request, res: Response): Promise<Response> => {
  const metrics = await getQueueMetricsService(req.user);

  return res.status(200).json(metrics);
};

export const centralizedQueue = async (req: Request, res: Response): Promise<Response> => {
  const parsed = queueQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  const result = await listQueueService(parsed.data, req.user);

  return res.status(200).json(result);
};
