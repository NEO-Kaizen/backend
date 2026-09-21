import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { evaluateScoreSchema } from "./prioritization.schema.ts";
import * as service from "./prioritization.service.ts";

function actorUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return id;
}

/** Valida `:protocol` no controller (substitui o cast — S2). */
const protocolParamsSchema = z.object({
  protocol: z.string().trim().min(1, "Protocolo é obrigatório."),
});

export const listCriteria = async (_req: Request, res: Response): Promise<Response> => {
  const response = await service.listActiveCriteria();

  return res.status(200).json(response);
};

export const evaluateScore = async (req: Request, res: Response): Promise<Response> => {
  const parsedParams = protocolParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new AppError(formatZodIssues(parsedParams.error, "params"), 400);
  }

  const parsed = evaluateScoreSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.evaluateScore(
    parsedParams.data.protocol,
    parsed.data,
    actorUserId(req),
  );

  return res.status(200).json(response);
};
