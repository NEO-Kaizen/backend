import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { evaluateScoreSchema } from "./prioritization.schema.ts";
import * as service from "./prioritization.service.ts";

function actorUserId(req: Request): number {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }
  return Number(req.user.id);
}

function assertProtocol(protocol: string): void {
  if (!protocol || protocol.trim() === "") {
    throw new AppError("Protocolo é obrigatório", 400);
  }
}

export const listCriteria = async (_req: Request, res: Response): Promise<Response> => {
  const response = await service.listActiveCriteria();

  return res.status(200).json(response);
};

export const evaluateScore = async (req: Request, res: Response): Promise<Response> => {
  assertProtocol(req.params.protocol as string);

  const parsed = evaluateScoreSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error), 400);
  }

  const response = await service.evaluateScore(
    req.params.protocol as string,
    parsed.data,
    actorUserId(req),
  );

  return res.status(200).json(response);
};