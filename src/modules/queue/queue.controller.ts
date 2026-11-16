import type { Request, Response } from "express";
import { zodValidationError } from "../../shared/validation/zodErrors.ts";
import { getQueueMetricsService, listQueueService } from "./queue.service.ts";
import { queueQuerySchema } from "./queue.schemas.ts";

export const getMetricsController = async (req: Request, res: Response): Promise<Response> => {
  const metrics = await getQueueMetricsService(req.user);

  return res.status(200).json(metrics);
};

export const centralizedQueue = async (req: Request, res: Response): Promise<Response> => {
  const parsed = queueQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw zodValidationError(parsed.error, "query");
  }

  const result = await listQueueService(parsed.data, req.user);

  return res.status(200).json(result);
};
