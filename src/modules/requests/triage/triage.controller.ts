import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../../shared/errors/AppError.ts";
import { ValidationError } from "../../../shared/errors/ValidationError.ts";
import { buildZodFieldErrors, formatZodIssues } from "../../../shared/validation/zodErrors.ts";
import { createTriagePayloadSchema } from "./triage.schema.ts";
import * as service from "./triage.service.ts";

const protocolParamsSchema = z.object({
  protocol: z.string().trim().min(1, "Protocolo é obrigatório."),
});

function actorFromRequest(req: Request): { id: number; email: string; name: string; role: string } {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  return {
    id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
  };
}

function assertProtocol(req: Request): string {
  const parsed = protocolParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "params"), 400);
  }

  return parsed.data.protocol;
}

export const getTriage = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocol(req);
  const actor = actorFromRequest(req);

  const triage = await service.getTriage(protocol, actor);

  return res.status(200).json(triage);
};

export const saveTriage = async (req: Request, res: Response): Promise<Response> => {
  const protocol = assertProtocol(req);
  const actor = actorFromRequest(req);

  const parsed = createTriagePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    const { message, fields } = buildZodFieldErrors(parsed.error);
    throw new ValidationError(fields, message);
  }

  const triage = await service.createTriage(protocol, parsed.data, actor, req.ip);

  return res.status(201).json(triage);
};
