import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/AppError.ts";
import { zodValidationError } from "../../shared/validation/zodErrors.ts";
import { evaluateScoreSchema } from "./prioritization.schema.ts";
import * as service from "./prioritization.service.ts";

function actorFromRequest(req: Request): { id: number; role: string } {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return { id, role: req.user.role };
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
    throw zodValidationError(parsedParams.error, "params");
  }

  const parsed = evaluateScoreSchema.safeParse(req.body);

  if (!parsed.success) {
    throw zodValidationError(parsed.error);
  }

  const response = await service.evaluateScore(
    parsedParams.data.protocol,
    parsed.data,
    actorFromRequest(req),
  );

  return res.status(200).json(response);
};
